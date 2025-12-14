// api/verify.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error('JSON parse failed:', e);
      }
    }

    const { product_permalink, license_key } = body || {};

    if (!license_key) {
      return res.status(400).json({ error: 'Missing license_key' });
    }

    console.log(`Verifying license: ${license_key}`);

    // Gumroad API 呼叫
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      // 關鍵修改：這裡加入了 product_id
      body: new URLSearchParams({
        product_permalink: product_permalink, // 雖然它報錯，但留著當備用
        product_id: '1J6_TrvcwHfoTE-wHhfDaA==', // <--- 這是錯誤訊息要求加上的
        license_key: license_key,
      }).toString(),
    });

    const data = await response.json();
    
    // 如果 Gumroad 回傳錯誤，將詳細訊息印出來
    if (!data.success) {
        console.error('Gumroad Verification Failed:', data);
    }
    
    return res.status(200).json(data);

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}