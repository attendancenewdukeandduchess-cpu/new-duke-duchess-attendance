import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await connectDB();
    
    // Hash the password perfectly using your app's setup
    const hashedPassword = await bcrypt.hash("emp123", 10);
    
    // Remove the broken one we made earlier
    await User.deleteOne({ employeeId: "E001" });

    // Create the perfect user
    const newUser = await User.create({
      employeeId: "E001",
      password: hashedPassword,
      name: "Admin",
      role: "admin",
      status: "ACTIVE",
      designation: "Manager"
    });

    return NextResponse.json({ message: "Success! User created.", user: newUser });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create user", details: error }, { status: 500 });
  }
}