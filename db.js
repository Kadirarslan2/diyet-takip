import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm';

const supabaseUrl = 'https://iavmpgvevuqgirmxwxtr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlhdm1wZ3ZldnVxZ2lybXh3eHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTQyNTksImV4cCI6MjA4OTU3MDI1OX0.Nv4EyW1e87DkVtXqq67Xmf36_NMYjPc0T0CwUfVOJ3A';

export const supabase = createClient(supabaseUrl, supabaseKey);