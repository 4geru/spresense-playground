import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const bucketName = 'line-images'
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // List files from storage bucket
    const { data: files, error } = await supabase
      .storage
      .from(bucketName)
      .list('', {
        limit: 1000,
        offset: 0,
      })

    if (error) {
      console.error('Storage list error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch files', 
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Total files in bucket: ${files?.length || 0}`)
    files?.forEach((file, index) => {
      console.log(`File ${index + 1}: ${file.name}`)
    })

    // Filter files containing "original_capture" and are image files
    const originalImages = files
      ?.filter(file => {
        const hasOriginalCapture = file.name.includes('original');
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
        console.log(`File: ${file.name}, hasOriginalCapture: ${hasOriginalCapture}, isImage: ${isImage}`);
        return hasOriginalCapture && isImage;
      })
      .map(file => {
        // Get public URL for each image
        const { data: urlData } = supabase
          .storage
          .from(bucketName)
          .getPublicUrl(file.name)
        
        return {
          name: file.name,
          url: urlData.publicUrl,
          created_at: file.created_at,
          updated_at: file.updated_at,
          size: file.metadata?.size
        }
      }) || []

    console.log(`Found ${originalImages.length} original comic capture images`)
    
    // Sort by creation date (newest first)
    originalImages.sort((a, b) => 
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )

    // Return all files for debugging if no filtered images found
    const debugInfo = originalImages.length === 0 ? {
      totalFiles: files?.length || 0,
      allFiles: files?.map(f => f.name) || []
    } : {};

    return new Response(
      JSON.stringify({
        success: true,
        count: originalImages.length,
        images: originalImages,
        debug: debugInfo
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})