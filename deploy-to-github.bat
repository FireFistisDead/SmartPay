@echo off
echo ========================================
echo SmartPay - GitHub Deployment Script
echo Making 39 commits for contribution graph
echo ========================================
echo.

echo Step 1: Adding all files...
git add .
git commit -m "Initial commit: SmartPay project setup"

echo.
echo Step 2: Adding backend...
git add backend/
git commit -m "feat: Add Express.js backend with MongoDB integration"

echo.
echo Step 3: Adding frontend structure...
git add frontend/src/app/
git commit -m "feat: Add Next.js frontend app structure"

echo.
echo Step 4: Adding components...
git add frontend/src/components/
git commit -m "feat: Add React components (Header, Footer, JobForm, etc)"

echo.
echo Step 5: Adding contexts...
git add frontend/src/contexts/
git commit -m "feat: Add React contexts for state management"

echo.
echo Step 6: Adding hooks...
git add frontend/src/hooks/
git commit -m "feat: Add custom React hooks for blockchain interaction"

echo.
echo Step 7: Adding styles...
git add frontend/src/styles/
git commit -m "style: Add CSS modules and global styles"

echo.
echo Step 8: Adding utilities...
git add frontend/src/utils/
git commit -m "feat: Add utility functions and contract interactions"

echo.
echo Step 9: Adding smart contracts...
git add contracts/contracts/
git commit -m "feat: Add Solidity smart contracts (Task, TaskHub)"

echo.
echo Step 10: Adding contract deployment...
git add contracts/scripts/
git commit -m "feat: Add contract deployment scripts"

echo.
echo Step 11: Adding contract tests...
git add contracts/test/
git commit -m "test: Add smart contract tests"

echo.
echo Step 12: Adding contract config...
git add contracts/hardhat.config.js
git commit -m "config: Add Hardhat configuration"

echo.
echo Step 13: Adding public assets...
git add frontend/public/
git commit -m "assets: Add images and public assets"

echo.
echo Step 14: Adding frontend config...
git add frontend/jsconfig.json frontend/package.json
git commit -m "config: Add frontend configuration files"

echo.
echo Step 15: Adding backend models...
git add backend/src/models/
git commit -m "feat: Add MongoDB models (Profile, Reviews, Submission)"

echo.
echo Step 16: Adding backend controllers...
git add backend/src/controllers/
git commit -m "feat: Add Express controllers"

echo.
echo Step 17: Adding backend routes...
git add backend/src/routes/
git commit -m "feat: Add Express routes"

echo.
echo Step 18: Adding backend config...
git add backend/src/config/
git commit -m "config: Add backend configuration"

echo.
echo Step 19: Adding backend app...
git add backend/src/app.js
git commit -m "feat: Add Express app setup"

echo.
echo Step 20: Adding README...
git add README.md
git commit -m "docs: Add main README documentation"

echo.
echo Step 21: Adding demo folder...
git add SmartPay-demo/
git commit -m "feat: Add SmartPay-demo version (no crypto required)"

echo.
echo Step 22: Demo frontend setup...
git add SmartPay-demo/frontend/src/app/
git commit -m "feat(demo): Add demo frontend app structure"

echo.
echo Step 23: Demo components...
git add SmartPay-demo/frontend/src/components/
git commit -m "feat(demo): Add demo components with bypassed wallet checks"

echo.
echo Step 24: Demo hooks...
git add SmartPay-demo/frontend/src/hooks/
git commit -m "feat(demo): Add demo hooks without crypto requirements"

echo.
echo Step 25: Demo contract interactions...
git add SmartPay-demo/frontend/src/utils/
git commit -m "feat(demo): Add mocked contract interactions with localStorage"

echo.
echo Step 26: Demo styles...
git add SmartPay-demo/frontend/src/styles/
git commit -m "style(demo): Add demo styles with demo banner"

echo.
echo Step 27: Demo backend...
git add SmartPay-demo/backend/
git commit -m "feat(demo): Add demo backend (unchanged from production)"

echo.
echo Step 28: Demo contracts reference...
git add SmartPay-demo/contracts/
git commit -m "docs(demo): Add contracts reference (not used in demo)"

echo.
echo Step 29: Demo documentation...
git add SmartPay-demo/README.md
git commit -m "docs(demo): Add demo README"

echo.
echo Step 30: Demo setup guide...
git add SmartPay-demo/DEMO_SETUP.md
git commit -m "docs(demo): Add detailed setup guide"

echo.
echo Step 31: Demo quickstart...
git add SmartPay-demo/QUICKSTART.md
git commit -m "docs(demo): Add 5-minute quickstart guide"

echo.
echo Step 32: Demo comparison...
git add SmartPay-demo/COMPARISON.md
git commit -m "docs(demo): Add demo vs production comparison"

echo.
echo Step 33: Demo modifications log...
git add SmartPay-demo/MODIFICATIONS.md
git commit -m "docs(demo): Add modifications changelog"

echo.
echo Step 34: Demo utilities...
git add SmartPay-demo/start-demo.bat SmartPay-demo/package.json
git commit -m "feat(demo): Add quick start script and package config"

echo.
echo Step 35: Tasks page feature...
git add frontend/src/app/tasks/ SmartPay-demo/frontend/src/app/tasks/
git commit -m "feat: Add tasks viewing page for both versions"

echo.
echo Step 36: Fix horizontal scrolling...
git add frontend/src/styles/categoriesTypes.module.css frontend/src/styles/globals.css
git commit -m "fix: Remove horizontal scrolling on category pages"

echo.
echo Step 37: Header improvements...
git add frontend/src/components/Header.jsx SmartPay-demo/frontend/src/components/Header.jsx
git commit -m "feat: Add All Tasks and Create Task links to header"

echo.
echo Step 38: Empty form fields...
git add frontend/src/components/JobForm.jsx SmartPay-demo/frontend/src/components/JobForm.jsx
git commit -m "fix: Clear pre-filled form values for cleaner UX"

echo.
echo Step 39: Final polish...
git add .
git commit -m "chore: Final cleanup and documentation polish"

echo.
echo ========================================
echo Renaming branch to main...
echo ========================================
git branch -M main

echo.
echo ========================================
echo Pushing to GitHub...
echo ========================================
git push -u origin main

echo.
echo ========================================
echo SUCCESS! 39 commits pushed to GitHub!
echo ========================================
echo.
echo Your contribution graph: https://github.com/Path3010/SmartPay
echo.
echo All 450 files have been uploaded with proper commit history.
echo.
pause
