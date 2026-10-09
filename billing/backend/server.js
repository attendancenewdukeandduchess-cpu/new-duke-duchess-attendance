const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Connect to MongoDB
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Billing Backend connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));
}

// Schemas & Models
const CustomerSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: String,
  gstin: String,
  balance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const ProductSchema = new mongoose.Schema({
  name: String,
  category: String, // 'Service' | 'Product'
  price: Number,
  taxRate: { type: Number, default: 18 },
  sku: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: String,
  customerName: String,
  customerPhone: String,
  date: { type: Date, default: Date.now },
  items: [{
    name: String,
    qty: Number,
    price: Number,
    taxRate: Number,
    amount: Number
  }],
  subtotal: Number,
  taxAmount: Number,
  discount: Number,
  total: Number,
  paymentStatus: { type: String, default: 'UNPAID' }, // 'PAID', 'UNPAID', 'PARTIAL'
  paymentMethod: { type: String, default: 'UPI' },
  notes: String
});

const ExpenseSchema = new mongoose.Schema({
  title: String,
  category: String,
  amount: Number,
  date: { type: Date, default: Date.now },
  vendor: String,
  paymentMode: String
});

const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
const Expense = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);

// API Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'Duke & Duchess Billing Backend' }));

// Customers
app.get('/api/customers', async (req, res) => {
  const customers = await Customer.find().sort({ createdAt: -1 });
  res.json(customers);
});
app.post('/api/customers', async (req, res) => {
  const customer = await Customer.create(req.body);
  res.json(customer);
});

// Products & Services
app.get('/api/products', async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});
app.post('/api/products', async (req, res) => {
  const product = await Product.create(req.body);
  res.json(product);
});

// Invoices
app.get('/api/invoices', async (req, res) => {
  const invoices = await Invoice.find().sort({ date: -1 });
  res.json(invoices);
});
app.post('/api/invoices', async (req, res) => {
  const count = await Invoice.countDocuments();
  const invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`;
  const invoiceData = { ...req.body, invoiceNumber };
  const invoice = await Invoice.create(invoiceData);
  res.json(invoice);
});

// Expenses
app.get('/api/expenses', async (req, res) => {
  const expenses = await Expense.find().sort({ date: -1 });
  res.json(expenses);
});
app.post('/api/expenses', async (req, res) => {
  const expense = await Expense.create(req.body);
  res.json(expense);
});

// Dashboard Stats
app.get('/api/dashboard', async (req, res) => {
  const invoices = await Invoice.find();
  const totalRevenue = invoices.filter(i => i.paymentStatus === 'PAID').reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalPending = invoices.filter(i => i.paymentStatus !== 'PAID').reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalInvoices = invoices.length;
  const totalCustomers = await Customer.countDocuments();
  res.json({ totalRevenue, totalPending, totalInvoices, totalCustomers });
});

app.listen(PORT, () => {
  console.log(`🚀 Billing Backend service running on port ${PORT}`);
});
