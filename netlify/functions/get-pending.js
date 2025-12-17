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
      headers, // <-- ДОБАВЬ И ЗДЕСЬ
      body: JSON.stringify({ error: 'Supabase credentials not configured' }) 
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data, error } = await supabase
      .from('access_codes')
      .select('code, package, status, id')
      .eq('status', 'pending')
      .order('id', { ascending: false });

    if (error) throw error;

    return {
      statusCode: 200,
      headers, // <-- ДОБАВЬ ЗДЕСЬ
      body: JSON.stringify(data || [])
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers, // <-- И ЗДЕСЬ
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      })
    };
  }
};
