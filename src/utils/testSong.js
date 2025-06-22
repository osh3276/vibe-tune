// Simple test function to create a mock song - you can call this from the browser console
export async function createTestSong() {
  try {
    const response = await fetch('/api/song', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Song - ' + new Date().toLocaleDateString(),
        description: 'A test song to verify the system is working',
        user_id: 'a82ab623-84eb-41d1-884d-6f55ae3bfd31', // Replace with current user ID
        status: 'completed',
        parameters: {
          prompt: 'upbeat electronic music',
          negativeTags: 'none'
        }
      })
    });

    if (response.ok) {
      const song = await response.json();
      console.log('Test song created:', song);
      
      // Update with a mock file URL
      await fetch('/api/song', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: song.id,
          file_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Mock audio file
          status: 'completed'
        })
      });
      
      console.log('Test song updated with audio URL');
      return song;
    } else {
      console.error('Failed to create test song:', await response.text());
    }
  } catch (error) {
    console.error('Error creating test song:', error);
  }
}

// To use this function:
// 1. Open browser console on your dashboard
// 2. Copy and paste this entire file content
// 3. Run: createTestSong()
