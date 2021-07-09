import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');
const yaml = require('js-yaml');

export default class HandleYaml
{
    async getData() {
        let fileContents = fs.readFileSync('./data.yaml', 'utf8');
        let data = yaml.load(fileContents);
        
        return data;
    }

    writeData(data) {
        let yamlStr = yaml.dump(data);
        fs.writeFileSync('./data.yaml', yamlStr, 'utf8'); 
    }
}