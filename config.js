// Supabase configuration for slideshow
// Replace these values with your actual Supabase credentials

const SUPABASE_CONFIG = {
    url: 'https://fyxftmwypdfuierggfqw.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5eGZ0bXd5cGRmdWllcmdnZnF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDIwODcwOSwiZXhwIjoyMDc1Nzg0NzA5fQ.A7vz2fx8TUKibYrcA2gsFJH3UaEjghGzxQWl9blHUeg', 
    bucketName: 'line-images'
};

// Export for use in slideshow
window.SUPABASE_CONFIG = SUPABASE_CONFIG;