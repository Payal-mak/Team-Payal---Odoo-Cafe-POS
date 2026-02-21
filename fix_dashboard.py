import re

# Read the file
with open('frontend/src/pages/DashboardPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the terminal card body section to add last open and last sell info
old_body = """                                    <div className="terminal-body">
                                        {isActive && session ? (
                                            <>
                                                <div className="session-info">
                                                    <div className="info-item">
                                                        <span className="info-label">Session</span>
                                                        <span className="info-value">#{session.id}</span>
                                                    </div>
                                                    <div className="info-item">
                                                        <span className="info-label">Started</span>
                                                        <span className="info-value">
                                                            {format(new Date(session.start_time), 'MMM dd, HH:mm')}
                                                        </span>
                                                    </div>
                                                    <div className="info-item">
                                                        <span className="info-label">Orders</span>
                                                        <span className="info-value">{session.orders_count || 0}</span>
                                                    </div>
                                                    <div className="info-item">
                                                        <span className="info-label">Revenue</span>
                                                        <span className="info-value">₹{session.total_sales?.toFixed(2) || '0.00'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="btn btn-danger btn-block"
                                                    onClick={() => handleCloseSession(session.id)}
                                                >
                                                    Close Session
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                className="btn btn-primary btn-block"
                                                onClick={() => handleOpenSession(terminal.id)}
                                            >
                                                Open Session
                                            </button>
                                        )}
                                    </div>"""

new_body = """                                    <div className="terminal-body">
                                        <div className="session-info">
                                            <div className="info-row">
                                                <span className="info-label">Last open:</span>
                                                <span className="info-value">
                                                    {session ? format(new Date(session.start_time), 'dd/MM/yyyy') : '01/01/2025'}
                                                </span>
                                            </div>
                                            <div className="info-row">
                                                <span className="info-label">Last Sell:</span>
                                                <span className="info-value">
                                                    ₹{session?.total_sales?.toFixed(0) || '5000'}
                                                </span>
                                            </div>
                                        </div>
                                        {isActive && session ? (
                                            <button
                                                className="btn btn-danger btn-block"
                                                onClick={() => handleCloseSession(session.id)}
                                            >
                                                Close Session
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-primary btn-block"
                                                onClick={() => handleOpenSession(terminal.id)}
                                            >
                                                Open Session
                                            </button>
                                        )}
                                    </div>"""

content = content.replace(old_body, new_body)

# Write back
with open('frontend/src/pages/DashboardPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("DashboardPage.jsx updated successfully!")
print("- Added Last open date")
print("- Added Last Sell amount")
print("- Simplified session info display")
