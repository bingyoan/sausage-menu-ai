// api/verify.js
export default async function handler(req, res) {
  // 1. 設定 CORS (允許瀏覽器連線)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. 處理預檢請求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 3. 強制解析 body (這是最容易出錯的地方)
    let body = req.body;
    
    // 如果收到的是字串，嘗試轉成 JSON
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error('JSON parse failed:', e);
      }
    }

    const { product_permalink, license_key } = body || {};

    // 4. 檢查參數是否存在
    if (!product_permalink || !license_key) {
      console.error('Missing parameters:', { product_permalink, license_key });
      return res.status(400).json({ 
        error: 'Missing parameters', 
        received: { product_permalink, license_key } 
      });
    }

    console.log(`Verifying: ${license_key} against ${product_permalink}`);

    // 5. 呼叫 Gumroad API
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      // 確保轉為 Gumroad 看得懂的格式
      body: new URLSearchParams({
        product_permalink,
        license_key,
      }).toString(),
    });

    const data = await response.json();
    
    // 6. 回傳結果
    console.log('Gumroad response:', data.success);
    return res.status(200).json(data);

  } catch (error) {
    // 7. 如果當機，回傳詳細錯誤原因
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
}