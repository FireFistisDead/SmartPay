console.log("Starting simple deployment test...");

async function main() {
  console.log("Script started");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exitCode = 1;
});
