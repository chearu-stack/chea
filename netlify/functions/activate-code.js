const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // CORS headers for GitHub Pages
  const headers = {
    'Access-Control-Allow-Origin': 'https://chearu-stack.github.io',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return { 
      statusCode: 500, 
      headers, // ✅ Добавил
      body: JSON.stringify({ error: 'Supabase credentials not configured' }) 
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { code } = event.queryStringParameters || {};
    
    if (!code) {
      return { 
        statusCode: 400, 
        headers, // ✅ Добавил
        body: JSON.stringify({ error: 'Missing code parameter' }) 
      };
    }

    const { data, error } = await supabase
      .from('access_codes')
      .update({ 
        status: 'active',
        activated_at: new Date().toISOString()
      })
      .eq('code', code)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return {
        statusCode: 404,
        headers, // ✅ Добавил
        body: JSON.stringify({ 
          error: 'Code not found or already activated' 
        })
      };
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' }, // ✅ Объединил заголовки
      body: JSON.stringify({ 
        success: true, 
        message: `Code ${code} activated`,
        data,
        caps_limit: data.caps_limit
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers, // ✅ Добавил
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      })
    };
  }
};
