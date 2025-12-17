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
      headers, // ✅
      body: JSON.stringify({ error: 'Supabase credentials not configured' }) 
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { code, usage = 100 } = event.queryStringParameters || {};
    
    if (!code) {
      return { 
        statusCode: 400, 
        headers, // ✅
        body: JSON.stringify({ error: 'Missing code parameter' }) 
      };
    }

    const { data: accessData, error: fetchError } = await supabase
      .from('access_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (fetchError || !accessData) {
      return {
        statusCode: 404,
        headers, // ✅
        body: JSON.stringify({ error: 'Code not found' })
      };
    }

    if (accessData.status !== 'active') {
      return {
        statusCode: 403,
        headers, // ✅
        body: JSON.stringify({ 
          error: 'Access not activated',
          status: accessData.status
        })
      };
    }

    const capsLimit = accessData.caps_limit || 0;
    const capsUsed = accessData.caps_used || 0;
    const requestedUsage = parseInt(usage, 10) || 100;
    
    if (capsUsed + requestedUsage > capsLimit) {
      return {
        statusCode: 403,
        headers, // ✅
        body: JSON.stringify({ 
          error: 'Caps limit exceeded',
          caps_used: capsUsed,
          caps_limit: capsLimit,
          remaining: capsLimit - capsUsed
        })
      };
    }

    let updatedCapsUsed = capsUsed;
    if (requestedUsage > 0) {
      const { error: updateError } = await supabase
        .from('access_codes')
        .update({ caps_used: capsUsed + requestedUsage })
        .eq('code', code);

      if (updateError) throw updateError;
      updatedCapsUsed = capsUsed + requestedUsage;
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' }, // ✅ Объединил
      body: JSON.stringify({
        success: true,
        access: 'granted',
        code: accessData.code,
        package: accessData.package,
        caps_used: updatedCapsUsed,
        caps_limit: capsLimit,
        remaining: capsLimit - updatedCapsUsed,
        status: accessData.status
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers, // ✅
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      })
    };
  }
};
