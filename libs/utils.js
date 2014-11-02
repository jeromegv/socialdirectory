function convertToSlug(Text)
{
    return Text
        .toLowerCase()
        .replace(/[^\w ]+/g,'')
        .replace(/ +/g,'-')
        ;
}
//make sure every url reference is saved with full HTTP or HTTPS
function saveUrl(entry){
  if (entry!=''){
    if (!/^(f|ht)tps?:\/\//i.test(entry)) {
      entry= "http://" + entry;
    }
  }
  return entry;
}
exports.saveUrl = saveUrl;
exports.convertToSlug = convertToSlug;
