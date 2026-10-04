const fs = require('fs');
const ts = require('typescript');
const program = ts.createProgram(['test_tldraw4.ts'], { allowJs: true });
const checker = program.getTypeChecker();
const sf = program.getSourceFile('test_tldraw4.ts');
function findAlias(node) {
    if (ts.isTypeAliasDeclaration(node) && node.name.text === 'T') {
        const type = checker.getTypeAtLocation(node.name);
        console.log(checker.typeToString(type));
    }
    ts.forEachChild(node, findAlias);
}
findAlias(sf);
