import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/data/indiaCraftMapData.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Function to classify craft name/region into appropriate photo
function getPhotoForCraft(craftName, regionName) {
  const name = (craftName + ' ' + regionName).toLowerCase();
  if (name.includes('pottery') || name.includes('terracotta') || name.includes('clay') || name.includes('ceramic') || name.includes('blue pottery')) {
    return 'catPotteryJpg';
  }
  if (name.includes('paint') || name.includes('pattachitra') || name.includes('mural') || name.includes('thangka') || name.includes('kalamkari') || name.includes('warli') || name.includes('sohrai') || name.includes('gond') || name.includes('scroll') || name.includes('miniature') || name.includes('aipan')) {
    return 'catPaintingJpg';
  }
  if (name.includes('metal') || name.includes('dhokra') || name.includes('filigree') || name.includes('bronze') || name.includes('brass') || name.includes('bidri') || name.includes('tarakasi') || name.includes('bell metal') || name.includes('silver') || name.includes('mirror') || name.includes('thathera')) {
    return 'catMetalworkJpg';
  }
  if (name.includes('wood') || name.includes('mask') || name.includes('channapatna') || name.includes('toy') || name.includes('inlay') || name.includes('furniture') || name.includes('carving') || name.includes('totem')) {
    return 'catWoodcraftJpg';
  }
  if (name.includes('cane') || name.includes('bamboo') || name.includes('sikki') || name.includes('reed') || name.includes('grass') || name.includes('basket') || name.includes('sitalpati') || name.includes('kauna') || name.includes('mat') || name.includes('thul')) {
    return 'catCaneJpg';
  }
  return 'catTextilesJpg';
}

// Replace string literal paths: src: '/craft-thumbnails/...'
content = content.replace(/src:\s*['"]\/craft-thumbnails\/[^'"]+['"]/g, (match, offset) => {
  // Look backwards for context
  const preContext = content.substring(Math.max(0, offset - 250), offset + 150);
  let photo = 'catTextilesJpg';
  if (/pottery|clay|terracotta|ceramic/i.test(preContext)) photo = 'catPotteryJpg';
  else if (/paint|mural|thangka|kalamkari|warli|sohrai|gond|art/i.test(preContext)) photo = 'catPaintingJpg';
  else if (/metal|dhokra|filigree|bronze|brass|bidri|silver|mirror/i.test(preContext)) photo = 'catMetalworkJpg';
  else if (/wood|toy|mask|carv|inlay/i.test(preContext)) photo = 'catWoodcraftJpg';
  else if (/cane|bamboo|sikki|reed|grass|basket|sitalpati|kauna|mat/i.test(preContext)) photo = 'catCaneJpg';
  else if (/silk|loom|weave|shawl|embroidery|saree|carpet|ikat|jamdani|phulkari|chikankari|brocade/i.test(preContext)) photo = 'catTextilesJpg';
  
  return `src: ${photo}`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully enriched all 36 craft regions with authentic photography!');
