const path = require('path');
const clone = require('clone');
const fs = require('fs');
const tmp = require('tmp');
const url = require('url');
const config = require('../config');
const request = config.request;

var addUrl = `${config.protocol}${config.host}/concern/generic_works`;
var uploadUrl = `${config.protocol}${config.host}/upload`;

// new
// /concern/{type}s

// update
// /concern/{type}s/{id}

var template = {
  utf8 : '✓',
  '{{type}}[title][]' : '',
  'authenticity_token' : '',
  '{{type}}[creator][]' : '',
  '{{type}}[keyword][]' : '',
  '{{type}}[rights_statement]' : 'http://rightsstatements.org/vocab/NKC/1.0/',
  '{{type}}[contributor][]' : '',
  '{{type}}[description][]' : '',
  '{{type}}[license][]' : '',
  '{{type}}[publisher][]' : '',
  '{{type}}[date_created][]' : '',
  '{{type}}[subject][]' : '',
  '{{type}}[language][]' : '',
  '{{type}}[identifier][]' : '',
  '{{type}}[based_near_attributes][0][hidden_label]' : '',
  '{{type}}[based_near_attributes][0][id]' : '',
  '{{type}}[based_near_attributes][0][_destroy]' : '',
  '{{type}}[related_url][]' : '',
  '{{type}}[source][]' : '',
  '{{type}}[resource_type][]' : '',
  'uploaded_files[]' : '',
  '{{type}}[admin_set_id]' : '',
  '{{type}}[member_of_collection_ids][]' : '',
  'new_user_name_skel' : '',
  'new_user_permission_skel' : 'none',
  'new_group_name_skel' : 'Select a group',
  'new_group_permission_skel' : 'none',
  '{{type}}[visibility]' : 'open',
  '{{type}}[visibility_during_embargo]' : 'restricted',
  '{{type}}[visibility_after_embargo]' : 'open',
  '{{type}}[visibility_during_lease]' : 'open',
  '{{type}}[visibility_after_lease]' : 'restricted',
  '{{type}}[embargo_release_date]' : new Date().toISOString().split('T')[0],
  '{{type}}[lease_expiration_date]' : new Date().toISOString().split('T')[0],
  agreement : 1
}

var metadataPostMap = {
  visibility : '{{type}}[visibility]',
  title : '{{type}}[title][]',
  creator : '{{type}}[creator][]',
  keyword : '{{type}}[keyword][]',
  rights_statement : '{{type}}[rights_statement]',
  contributor : '{{type}}[contributor][]',
  description : '{{type}}[description][]',
  license : '{{type}}[license][]',
  publisher : '{{type}}[publisher][]',
  date_created : '{{type}}[date_created][]',
  subject : '{{type}}[subject][]',
  language : '{{type}}[language][]',
  identifier : '{{type}}[identifier][]',
  related_url : '{{type}}[related_url][]',
  source : '{{type}}[source][]',
  resource_type : '{{type}}[resource_type][]',
  admin_set_id : '{{type}}[admin_set_id]',
  member_of_collection_ids : '{{type}}[member_of_collection_ids][]',
}


function downloadFile(url) {
  return new Promise((resolve, reject) => {
    let tmpfile = tmp.fileSync().name;
    let stream = fs.createWriteStream(tmpfile);
    let req = request.get(url);
    req.pipe(stream);
    stream.on('close', () => resolve(tmpfile));
  });
}

// response
// {"files":[{"id":6,"name":"testcookie.txt","size":797,"deleteUrl":"/uploads/6?locale=en","deleteType":"DELETE"}]}
async function addFile(metadata, filepath, type, errors) {
  if( !metadata ) throw new Error('Metadata parameter required');
  if( !filepath ) throw new Error('Filepath parameter required');
  
  var filename, remove = false;

  if( filepath.match(/^http/i) ) {
    console.log(`Downloading file: ${metadata.identifier} ${filepath}`);
    
    filename = path.parse(url.parse(filepath).path).base;
    filepath = await downloadFile(filepath);

    remove = true;
  } else {
    filename = path.parse(filepath).base;
  }
  
  console.log(`Adding file: ${metadata.identifier} ${filepath} as ${filename}`);
  console.time('File Upload Time '+metadata.identifier);

  try {
    var req = request
      .post(`${config.protocol}${config.host}/uploads`)
      .set('Accept', 'application/json, text/javascript, */*; q=0.01')
      .set('Accept-Language','en-US,en;q=0.8')
      .set('Cache-Control', 'no-cache')
      .set('Connection', 'keep-alive')
      .set('Host', config.host)
      .set('Origin', `${config.protocol}${config.host}`)
      .set('Pragma', 'no-cache')
      .set('Referer', `${config.protocol}${config.host}/concern/generic_works/new?locale=en`)
      .set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36')
      .set('X-Requested-With', 'XMLHttpRequest')        
      .attach('files[]', filepath, filename)

    addFields(mergeMetadataToPostNames(metadata, type), req);

    var res = await req;
    console.timeEnd('File Upload Time '+metadata.identifier);

    if( remove ) {
      fs.unlinkSync(filepath);
    }

    return res.body;
  } catch(e) {
    errors.push({
      id : metadata.identifier,
      message : 'Failed to Add File',
      file : filepath
    });
    console.error(e.message);
    console.error(e.stack);
    console.error(`Error adding file: ${metadata.identifier} ${filepath}`);
    process.exit(-1);
  }
}

async function addWork(metadata, files, errors) {
  try {
    
    var ids = [];
    var type = (metadata.type || 'generic_work').toLowerCase();

    for( var i = 0; i < files.length; i++ ) {
      var uploadRes = await addFile(metadata, files[i], type, errors);
      ids.push(uploadRes.files[0].id);
    }
    
    console.time('Work Add Time '+metadata.identifier);
    var req = request
          .post(`${config.protocol}${config.host}/concern/${type}s`)
          .set('Accept','text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
          .set('Accept-Language','en-US,en;q=0.8')
          .set('Cache-Control', 'no-cache')
          .set('Connection', 'keep-alive')
          .set('Host', config.host)
          .set('Origin', `${config.protocol}${config.host}`)
          .set('Referer', `${config.protocol}${config.host}/concern/${type}s/new?locale=en`)


    ids.forEach(id => req.field('uploaded_files[]', id));
    addFields(mergeMetadataToPostNames(metadata, type), req);
    if( type === 'images' ) {
      req.field('image[extent][]', '');
    }

    var res = await req;
    console.timeEnd('Work Add Time '+metadata.identifier);
    return res.body;
  } catch(e) {
    errors.push({
      id : metadata.identifier,
      message : 'Failed to Add Work'
    });
    console.error(e.message);
    console.error(e.stack);
    console.error(`Error adding work: ${metadata.identifier}`);
  }
}

function addFields(metadata, req) {
    for( var key in metadata ) {
      var val = metadata[key];
      if( Array.isArray(val) ) {
        val.forEach(val => {
          if( !val ) return;
          req.field(key, val)
        });
      } else {
        req.field(key, val);
      }
    }
}

function mergeMetadataToPostNames(metadata, type) {
  var tmp = clone(template);
  var newPostMetadata = {};

  for( var key in tmp ) {
    newPostMetadata[key.replace(/{{type}}/, type)] = tmp[key];
  }

  for( var key in metadata ) {
    if( metadataPostMap[key] ) {
      newPostMetadata[metadataPostMap[key].replace(/{{type}}/, type)] = metadata[key];
    }
  }

  return newPostMetadata;
}

module.exports = addWork;