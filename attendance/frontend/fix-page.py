
correct = """                           <div>
                            <div className="flex items-center gap-2">
                              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{emp.name}</h3>
                              <span className="badge" style={{ backgroundColor: '#f3f4f6', color: 'var(--text-main)', fontSize: '0.75rem' }}>
                                {emp.employeeId}
                              </span>
                            </div>
                            <p className="text-muted text-sm">{emp.designation || 'Staff'} \u2022 {emp.department || 'Salon'}</p>
                          </div>
                        </div>

                        {/* Action Buttons + Today Status */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(emp)}
                              title="Edit employee details"
                              style={{
                                background: 'rgba(197,160,89,0.12)',
                                border: '1px solid rgba(197,160,89,0.3)',
                                borderRadius: '8px',
                                padding: '0.35rem 0.65rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                color: 'var(--accent-gold)',
                                fontSize: '0.8rem',
                                fontWeight: 600
                              }}
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                            <button
                              onClick={() => { setDeleteEmpData({ _id: emp._id, name: emp.name, employeeId: emp.employeeId }); setDeleteEmpModalOpen(true); }}
                              title="Remove employee from system"
                              style={{
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: '8px',
                                padding: '0.35rem 0.65rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                color: '#ef4444',
                                fontSize: '0.8rem',
                                fontWeight: 600
                              }}
                            >
                              <Trash2 size={14} />
                              Remove
                            </button>
                          </div>
                          <div>
"""

with open(r'c:\new duke and duchess attendance\attendance\frontend\src\app\page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Replace lines 1535-1602 (0-indexed) which is the corrupted block
new_lines = lines[:1535] + [correct] + lines[1603:]

with open(r'c:\new duke and duchess attendance\attendance\frontend\src\app\page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f'Done. Total lines: {len(new_lines)}')
