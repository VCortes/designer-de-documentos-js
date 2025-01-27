const fs = require('fs/promises');
const path = require('path');

async function ensureDirectoryExistence(filePath) {
    const dirName = path.dirname(filePath);
    try {
        await fs.access(dirName);
    } catch (e) {
        // Se deu erro de acesso, tentar criar recursivamente
        await fs.mkdir(dirName, { recursive: true });
    }
}

async function saveResponseToFile(responsePath, content) {
    await ensureDirectoryExistence(responsePath);
    const response = JSON.stringify(content, null, 4);
    await fs.writeFile(responsePath, response, 'utf8');
    console.log('Arquivo JSON salvo com sucesso!');
}
module.exports = saveResponseToFile;
