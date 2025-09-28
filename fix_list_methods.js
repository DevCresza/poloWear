const fs = require('fs');
const path = require('path');

// Páginas para corrigir
const pagesToFix = [
  'src/pages/Carrinho.jsx',
  'src/pages/GestaoClientes.jsx',
  'src/pages/GestaoEstoque.jsx',
  'src/pages/GestaoProdutos.jsx',
  'src/pages/MeusPedidos.jsx',
  'src/pages/Recursos.jsx',
  'src/pages/UserManagement.jsx'
];

// Padrões de substituição
const replacements = [
  {
    from: /const (\w+)List = await (\w+)\.list\(\);/g,
    to: 'const $1Result = await $2.find();\n      const $1List = $1Result.success ? $1Result.data : [];'
  },
  {
    from: /(\w+)\.list\(\)/g,
    to: '$1.find()'
  }
];

pagesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    replacements.forEach(replacement => {
      content = content.replace(replacement.from, replacement.to);
    });

    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  }
});

console.log('All pages fixed!');