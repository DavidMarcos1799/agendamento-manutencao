(async function(){
  try{
    const resp = await fetch('http://localhost:3000/recuperar-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'naoexiste@example.com' })
    });
    const text = await resp.text();
    console.log('Status:', resp.status);
    console.log('Body:', text);
  }catch(err){
    console.error('Erro:', err && err.message ? err.message : err);
  }
})();
