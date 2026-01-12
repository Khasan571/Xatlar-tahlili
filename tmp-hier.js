const {Client}=require('pg');
const fs=require('fs');
const data=JSON.parse(fs.readFileSync('vazir_hierarchy.json','utf8'));
const client=new Client({user:'postgres',password:'5432',host:'localhost',port:5432,database:'xatlar'});
(async()=>{
  const text='INSERT INTO hierarchy (id,data,updated_at) VALUES (1,$1,now()) ON CONFLICT (id) DO UPDATE SET data=EXCLUDED.data, updated_at=now()';
  console.log('query:', text);
  try{
    await client.connect();
    await client.query(text,[data]);
    console.log('done');
  }catch(e){
    console.error('err', e);
  } finally{
    await client.end();
  }
})();
