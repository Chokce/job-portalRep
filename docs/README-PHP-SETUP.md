# PHP Server Setup for JobConnect

Your job portal now saves jobs to the `jobs.json` file! Here's how to run it:

## Quick Start

### Option 1: Built-in PHP Server (Easiest)
1. Open Command Prompt/Terminal
2. Navigate to your project folder:
   ```
   cd "C:\Users\CHOKCE PC_THE MMC\Desktop\jobportal"
   ```
3. Start PHP server:
   ```
   php -S localhost:8000
   ```
4. Open browser and go to: `http://localhost:8000`

### Option 2: XAMPP (Recommended for Windows)
1. Download XAMPP from: https://www.apachefriends.org/
2. Install and start Apache
3. Copy your jobportal folder to: `C:\xampp\htdocs\`
4. Open browser and go to: `http://localhost/jobportal`

## How It Works Now

✅ **Job Posting**: Jobs are saved to `app/data/jobs.json`
✅ **Job Display**: Jobs load from the JSON file
✅ **File Storage**: You can see jobs in the file system

## Testing

1. Start your PHP server (using one of the options above)
2. Go to the Post Job page
3. Fill out and submit a job
4. Check `app/data/jobs.json` - you'll see your job there!
5. Go to Find Jobs page - your job will appear

## Troubleshooting

**Error: "PHP server not running"**
- Make sure you started the PHP server$
- Check the URL matches your server (localhost:8000 or localhost/jobportal)

**Jobs not saving**
- Check if `app/data/` folder has write permissions
- Look at browser console (F12) for error messages

## File Locations

- **Jobs stored in**: `app/data/jobs.json`
- **PHP APIs**: `app/api/post-job.php` and `app/api/get-jobs.php`
- **Test file**: `test-php.php` (to verify PHP is working)
