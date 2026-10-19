// Tech names → icons for GitHub READMEs.
//   icon:  skillicons.dev id        slug/color: shields.io badge logo (Simple Icons) and brand colour
// [label, skillicons id | '', simple-icons slug | '', brand colour, ...aliases]
const TECH = [
  ['JavaScript', 'js', 'javascript', 'F7DF1E', 'js', 'es6'],
  ['TypeScript', 'ts', 'typescript', '3178C6', 'ts'],
  ['Python', 'py', 'python', '3776AB', 'python3'],
  ['Java', 'java', 'openjdk', 'ED8B00', 'core java'],
  ['C', 'c', 'c', 'A8B9CC'],
  ['C++', 'cpp', 'cplusplus', '00599C', 'cpp'],
  ['C#', 'cs', 'dotnet', '512BD4', 'csharp'],
  ['Go', 'go', 'go', '00ADD8', 'golang'],
  ['Rust', 'rust', 'rust', '000000'],
  ['Kotlin', 'kotlin', 'kotlin', '7F52FF'],
  ['Swift', 'swift', 'swift', 'F05138'],
  ['Dart', 'dart', 'dart', '0175C2'],
  ['Ruby', 'ruby', 'ruby', 'CC342D'],
  ['PHP', 'php', 'php', '777BB4'],
  ['R', 'r', 'r', '276DC3'],
  ['Scala', 'scala', 'scala', 'DC322F'],
  ['Haskell', 'haskell', 'haskell', '5D4F85'],
  ['Lua', 'lua', 'lua', '2C2D72'],
  ['Solidity', 'solidity', 'solidity', '363636'],
  ['SQL', '', '', '336791'],
  ['HTML', 'html', 'html5', 'E34F26', 'html5'],
  ['CSS', 'css', 'css', '1572B6', 'css3'],
  ['Sass', 'sass', 'sass', 'CC6699', 'scss'],
  ['Bash', 'bash', 'gnubash', '4EAA25', 'shell', 'shell scripting'],
  ['React', 'react', 'react', '61DAFB', 'react.js', 'reactjs'],
  ['Next.js', 'nextjs', 'nextdotjs', '000000', 'nextjs', 'next'],
  ['Vue.js', 'vuejs', 'vuedotjs', '4FC08D', 'vue', 'vuejs'],
  ['Angular', 'angular', 'angular', 'DD0031'],
  ['Svelte', 'svelte', 'svelte', 'FF3E00', 'sveltekit'],
  ['Tailwind CSS', 'tailwind', 'tailwindcss', '06B6D4', 'tailwind', 'tailwindcss'],
  ['Bootstrap', 'bootstrap', 'bootstrap', '7952B3'],
  ['Redux', 'redux', 'redux', '764ABC'],
  ['Three.js', 'threejs', 'threedotjs', '000000', 'threejs'],
  ['Node.js', 'nodejs', 'nodedotjs', '339933', 'node', 'nodejs'],
  ['Express', 'express', 'express', '000000', 'express.js', 'expressjs'],
  ['NestJS', 'nestjs', 'nestjs', 'E0234E'],
  ['Django', 'django', 'django', '092E20'],
  ['Flask', 'flask', 'flask', '000000'],
  ['FastAPI', 'fastapi', 'fastapi', '009688'],
  ['Spring', 'spring', 'spring', '6DB33F', 'spring boot', 'springboot'],
  ['GraphQL', 'graphql', 'graphql', 'E10098'],
  ['Rails', 'rails', 'rubyonrails', 'D30001', 'ruby on rails'],
  ['Laravel', 'laravel', 'laravel', 'FF2D20'],
  ['.NET', 'dotnet', 'dotnet', '512BD4', 'dotnet', 'asp.net'],
  ['PostgreSQL', 'postgres', 'postgresql', '4169E1', 'postgres'],
  ['MySQL', 'mysql', 'mysql', '4479A1'],
  ['MongoDB', 'mongodb', 'mongodb', '47A248', 'mongo'],
  ['Redis', 'redis', 'redis', 'DC382D'],
  ['SQLite', 'sqlite', 'sqlite', '003B57'],
  ['Firebase', 'firebase', 'firebase', 'FFCA28', 'firestore'],
  ['Supabase', 'supabase', 'supabase', '3FCF8E'],
  ['Prisma', 'prisma', 'prisma', '2D3748'],
  ['Elasticsearch', 'elasticsearch', 'elasticsearch', '005571'],
  ['Cassandra', 'cassandra', 'apachecassandra', '1287B1'],
  ['Docker', 'docker', 'docker', '2496ED'],
  ['Kubernetes', 'kubernetes', 'kubernetes', '326CE5', 'k8s'],
  ['AWS', 'aws', 'amazonwebservices', '232F3E', 'amazon web services'],
  ['Google Cloud', 'gcp', 'googlecloud', '4285F4', 'gcp'],
  ['Azure', 'azure', 'microsoftazure', '0078D4', 'microsoft azure'],
  ['Terraform', 'terraform', 'terraform', '7B42BC'],
  ['Jenkins', 'jenkins', 'jenkins', 'D24939'],
  ['GitHub Actions', 'githubactions', 'githubactions', '2088FF'],
  ['Nginx', 'nginx', 'nginx', '009639'],
  ['Kafka', 'kafka', 'apachekafka', '231F20', 'apache kafka'],
  ['RabbitMQ', 'rabbitmq', 'rabbitmq', 'FF6600'],
  ['Vercel', 'vercel', 'vercel', '000000'],
  ['Netlify', 'netlify', 'netlify', '00C7B7'],
  ['Heroku', 'heroku', 'heroku', '430098'],
  ['Linux', 'linux', 'linux', 'FCC624'],
  ['Ubuntu', 'ubuntu', 'ubuntu', 'E95420'],
  ['Git', 'git', 'git', 'F05032'],
  ['GitHub', 'github', 'github', '181717'],
  ['GitLab', 'gitlab', 'gitlab', 'FC6D26'],
  ['Jest', 'jest', 'jest', 'C21325'],
  ['Cypress', 'cypress', 'cypress', '17202C'],
  ['Selenium', 'selenium', 'selenium', '43B02A'],
  ['Postman', 'postman', 'postman', 'FF6C37'],
  ['Figma', 'figma', 'figma', 'F24E1E'],
  ['VS Code', 'vscode', 'visualstudiocode', '007ACC', 'vscode', 'visual studio code'],
  ['Vite', 'vite', 'vite', '646CFF'],
  ['Webpack', 'webpack', 'webpack', '8DD6F9'],
  ['npm', 'npm', 'npm', 'CB3837'],
  ['TensorFlow', 'tensorflow', 'tensorflow', 'FF6F00'],
  ['PyTorch', 'pytorch', 'pytorch', 'EE4C2C'],
  ['scikit-learn', 'sklearn', 'scikitlearn', 'F7931E', 'sklearn'],
  ['Pandas', '', 'pandas', '150458'],
  ['NumPy', '', 'numpy', '013243'],
  ['OpenCV', 'opencv', 'opencv', '5C3EE8'],
  ['Flutter', 'flutter', 'flutter', '02569B'],
  ['Android', 'androidstudio', 'android', '3DDC84', 'android studio'],
  ['Electron', 'electron', 'electron', '47848F'],
  ['Arduino', 'arduino', 'arduino', '00878F'],
  ['Raspberry Pi', 'raspberrypi', 'raspberrypi', 'A22846'],
  ['MATLAB', 'matlab', '', '0076A8'],
  ['AutoCAD', 'autocad', 'autodesk', 'E51050'],
  ['Unity', 'unity', 'unity', '000000'],
  ['Blender', 'blender', 'blender', 'F5792A'],
  ['Photoshop', 'ps', 'adobephotoshop', '31A8FF'],
  ['Illustrator', 'ai', 'adobeillustrator', 'FF9A00'],
  ['LaTeX', 'latex', 'latex', '008080'],
  ['Notion', 'notion', 'notion', '000000'],
];

const norm = (s) => String(s || '').toLowerCase().replace(/[\s.]+/g, '').trim();
const INDEX = new Map();
TECH.forEach(([label, icon, slug, color, ...aliases]) => {
  const t = { label, icon, slug, color };
  [label, ...aliases].forEach((a) => INDEX.set(norm(a), t));
});

// "React, Node.js (Express), AWS (EC2, S3)" → [{label, icon, slug, color}]  (unknown names keep just a label)
export function techList(text) {
  const out = [];
  const seen = new Set();
  String(text || '')
    .replace(/\([^)]*\)/g, '')
    .split(/[,;|/·•]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .forEach((name) => {
      const t = INDEX.get(norm(name)) || { label: name, icon: '', slug: '', color: '555555' };
      if (seen.has(t.label)) return;
      seen.add(t.label);
      out.push(t);
    });
  return out;
}
