const fs = require('fs-extra');
const { execSync } = require('child_process');

async function build() {
    try {
        console.log('Starting build process...');

        // Define paths
        const distDir = 'dist';
        const localesDir = 'locales';

        // 1. Clean and create the distribution directory
        console.log(`Cleaning and creating '${distDir}' directory...`);
        await fs.emptyDir(distDir);
        
        // 2. Transpile the main TSX file to JavaScript
        console.log('Transpiling index.tsx to index.js...');
        const babelCommand = `npx babel index.tsx --out-file ${distDir}/index.js --presets=@babel/preset-env,@babel/preset-react,@babel/preset-typescript`;
        execSync(babelCommand, { stdio: 'inherit' });

        // 3. Copy static assets (locales folder and metadata)
        console.log(`Copying '${localesDir}' directory...`);
        await fs.copy(localesDir, `${distDir}/${localesDir}`);
        
        console.log('Copying metadata.json...');
        await fs.copy('metadata.json', `${distDir}/metadata.json`);
        
        // 4. Process and copy index.html for production
        console.log('Processing index.html for production...');
        let htmlContent = await fs.readFile('index.html', 'utf8');

        // Remove the Babel Standalone script as it's not needed for the pre-transpiled code
        htmlContent = htmlContent.replace('<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>', '<!-- Babel Standalone removed for production build -->');

        // Update the script tag to point to the compiled JavaScript file
        htmlContent = htmlContent.replace(
            '<script type="text/babel" data-type="module" src="./index.tsx"></script>',
            '<script type="module" src="./index.js"></script>'
        );
        
        // Write the processed HTML to the dist directory
        await fs.writeFile(`${distDir}/index.html`, htmlContent, 'utf8');

        console.log('Build finished successfully!');

    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();
