const fs = require('fs');
const path = require('path');
function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    fs.mkdirSync(dirname, { recursive: true });
}
function saveResponseToFile(responsePath, content) {
    ensureDirectoryExistence(responsePath);
    const response = JSON.stringify(content, null, 4);
    fs.writeFile(responsePath, response, 'utf8', (err) => {
        if (err) {
            console.error('Erro ao salvar o arquivo JSON:', err);
        } else {
            console.log('Arquivo JSON salvo com sucesso!');
        }
    });
}
module.exports = saveResponseToFile;
