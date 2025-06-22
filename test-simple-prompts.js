// Test script to verify simplified prompts
console.log('Testing simplified prompt generation...');

// Simulate the new prompt cleaning function
function cleanPromptForLyria(prompt) {
  let cleaned = prompt
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const genres = ['pop', 'rock', 'jazz', 'blues', 'folk', 'classical', 'electronic', 'hip hop', 'country', 'reggae'];
  const moods = ['happy', 'sad', 'calm', 'energetic', 'upbeat', 'mellow', 'dramatic', 'peaceful', 'exciting'];
  const instruments = ['piano', 'guitar', 'drums', 'violin', 'bass', 'synth', 'vocals'];

  const foundGenres = genres.filter(genre => cleaned.includes(genre));
  const foundMoods = moods.filter(mood => cleaned.includes(mood));
  const foundInstruments = instruments.filter(instrument => cleaned.includes(instrument));

  let simplifiedPrompt = '';
  
  if (foundMoods.length > 0) {
    simplifiedPrompt += foundMoods[0] + ' ';
  } else {
    simplifiedPrompt += 'upbeat ';
  }
  
  if (foundGenres.length > 0) {
    simplifiedPrompt += foundGenres[0];
  } else {
    simplifiedPrompt += 'pop';
  }
  
  if (foundInstruments.length > 0) {
    simplifiedPrompt += ' ' + foundInstruments[0];
  }

  if (simplifiedPrompt.length > 50) {
    simplifiedPrompt = simplifiedPrompt.substring(0, 47) + '...';
  }

  return simplifiedPrompt.trim();
}

// Test cases
const testCases = [
  "Create an energetic pop song with driving drums and synthesizers",
  "Generate a calm jazz piece with piano and soft melodies",
  "Make a rock song with electric guitar and powerful vocals",
  "Peaceful classical music with violin and orchestral arrangements",
  "Create an upbeat electronic dance track with synth sounds",
  "A sad blues song with guitar and emotional vocals",
  "Folk music with acoustic guitar and storytelling lyrics"
];

console.log('Original → Simplified:');
console.log('=======================');

testCases.forEach(test => {
  const simplified = cleanPromptForLyria(test);
  console.log(`"${test}" → "${simplified}"`);
});

console.log('\nAll prompts are under 50 characters and use simple keywords only.');
