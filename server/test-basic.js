console.log('Node.js is working!');
console.log('Current directory:', process.cwd());
console.log('Node.js version:', process.version);

// Test if we can require basic modules
try {
  const express = require('express');
  console.log('Express loaded successfully');
} catch (error) {
  console.error('Error loading Express:', error.message);
}

try {
  const mongoose = require('mongoose');
  console.log('Mongoose loaded successfully');
} catch (error) {
  console.error('Error loading Mongoose:', error.message);
}

console.log('Test completed successfully!');
