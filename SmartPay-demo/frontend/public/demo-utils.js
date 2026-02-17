// Demo Mode Utility Functions
// Use these functions in browser console for demo management

// Clear all demo tasks
window.clearDemoTasks = function() {
  localStorage.removeItem('smartpay_demo_tasks');
  console.log('✅ All demo tasks cleared! Refresh the page to see default sample tasks.');
};

// View current demo tasks
window.viewDemoTasks = function() {
  const stored = localStorage.getItem('smartpay_demo_tasks');
  if (stored) {
    const data = JSON.parse(stored);
    console.log(`📋 Demo Tasks (${data.tasks.length} total):`);
    console.table(data.tasks.map(t => ({
      ID: t.id,
      Title: t.title,
      Reward: t.reward + ' ETH',
      Category: t.minorTypeOfTask,
      Status: ['Created', 'Assigned', 'Completed'][t.status] || 'Unknown'
    })));
  } else {
    console.log('📋 No demo tasks stored yet.');
  }
};

// Reset to default sample tasks
window.resetDemoTasks = function() {
  window.clearDemoTasks();
  console.log('🔄 Demo tasks will reset to defaults on next page load.');
};

console.log(`
🎭 SmartPay Demo Mode Utilities Loaded!

Available commands:
- viewDemoTasks()  : View all stored demo tasks
- clearDemoTasks() : Clear all demo tasks
- resetDemoTasks() : Reset to default sample tasks

Type any command in console to use it!
`);
