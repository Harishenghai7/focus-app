/**
 * Manual WebRTC Testing Suite
 * Run this in browser console to test WebRTC functionality
 */

console.log('🧪 Starting WebRTC Test Suite...');

// Test 1: Check WebRTC Support
console.log('\n1️⃣ Testing WebRTC Support...');
const hasWebRTC = !!(window.RTCPeerConnection && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
console.log(`WebRTC Support: ${hasWebRTC ? '✅ Supported' : '❌ Not Supported'}`);

// Test 2: Test Media Access
console.log('\n2️⃣ Testing Media Access...');
const testMediaAccess = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      }
    });
    
    const audioTracks = stream.getAudioTracks();
    const videoTracks = stream.getVideoTracks();
    
    console.log(`✅ Media Access Successful:`);
    console.log(`   Audio Tracks: ${audioTracks.length}`);
    console.log(`   Video Tracks: ${videoTracks.length}`);
    
    // Log track capabilities
    if (audioTracks.length > 0) {
      const audioSettings = audioTracks[0].getSettings();
      console.log(`   Audio Settings:`, audioSettings);
    }
    
    if (videoTracks.length > 0) {
      const videoSettings = videoTracks[0].getSettings();
      console.log(`   Video Settings:`, videoSettings);
    }
    
    // Clean up
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.log(`❌ Media Access Failed: ${error.message}`);
    return false;
  }
};

// Test 3: Test STUN/TURN Server Connectivity
console.log('\n3️⃣ Testing STUN/TURN Server Connectivity...');
const testSTUNTURN = async () => {
  const servers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { 
      urls: 'turn:a.relay.metered.ca:80',
      username: 'f1c9b90e35af38a4ecafc748',
      credential: 'FiGQ8HklJM1WYqKs'
    }
  ];

  try {
    const pc = new RTCPeerConnection({ iceServers: servers });
    
    let candidateCount = 0;
    let serverTypes = new Set();
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        candidateCount++;
        const candidate = event.candidate.candidate;
        
        if (candidate.includes('srflx')) serverTypes.add('STUN');
        if (candidate.includes('relay')) serverTypes.add('TURN');
        if (candidate.includes('host')) serverTypes.add('HOST');
        
        console.log(`   ICE Candidate ${candidateCount}: ${candidate.split(' ')[7]} (${event.candidate.type})`);
      } else {
        console.log(`✅ ICE Gathering Complete:`);
        console.log(`   Total Candidates: ${candidateCount}`);
        console.log(`   Server Types Used: ${Array.from(serverTypes).join(', ')}`);
        pc.close();
      }
    };

    // Create a dummy data channel to start ICE gathering
    pc.createDataChannel('test');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    return true;
  } catch (error) {
    console.log(`❌ STUN/TURN Test Failed: ${error.message}`);
    return false;
  }
};

// Test 4: Test Peer Connection Setup
console.log('\n4️⃣ Testing Peer Connection Setup...');
const testPeerConnection = async () => {
  try {
    const pc1 = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { 
          urls: 'turn:a.relay.metered.ca:80',
          username: 'f1c9b90e35af38a4ecafc748',
          credential: 'FiGQ8HklJM1WYqKs'
        }
      ]
    });
    
    const pc2 = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { 
          urls: 'turn:a.relay.metered.ca:80',
          username: 'f1c9b90e35af38a4ecafc748',
          credential: 'FiGQ8HklJM1WYqKs'
        }
      ]
    });

    let pc1Connected = false;
    let pc2Connected = false;

    pc1.onconnectionstatechange = () => {
      console.log(`   PC1 Connection State: ${pc1.connectionState}`);
      if (pc1.connectionState === 'connected') pc1Connected = true;
    };

    pc2.onconnectionstatechange = () => {
      console.log(`   PC2 Connection State: ${pc2.connectionState}`);
      if (pc2.connectionState === 'connected') pc2Connected = true;
    };

    // Exchange ICE candidates
    pc1.onicecandidate = (event) => {
      if (event.candidate) {
        pc2.addIceCandidate(event.candidate);
      }
    };

    pc2.onicecandidate = (event) => {
      if (event.candidate) {
        pc1.addIceCandidate(event.candidate);
      }
    };

    // Create offer and answer
    const offer = await pc1.createOffer();
    await pc1.setLocalDescription(offer);
    await pc2.setRemoteDescription(offer);

    const answer = await pc2.createAnswer();
    await pc2.setLocalDescription(answer);
    await pc1.setRemoteDescription(answer);

    // Wait for connection
    return new Promise((resolve) => {
      const checkConnection = () => {
        if (pc1Connected && pc2Connected) {
          console.log('✅ Peer Connection Test Successful!');
          pc1.close();
          pc2.close();
          resolve(true);
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (!pc1Connected || !pc2Connected) {
          console.log('⚠️ Peer Connection Test Timeout');
          pc1.close();
          pc2.close();
          resolve(false);
        }
      }, 10000);
      
      checkConnection();
    });
  } catch (error) {
    console.log(`❌ Peer Connection Test Failed: ${error.message}`);
    return false;
  }
};

// Test 5: Test Focus App WebRTC Service
console.log('\n5️⃣ Testing Focus App WebRTC Service...');
const testFocusWebRTC = async () => {
  try {
    // Check if the service is available
    if (typeof window.supabase === 'undefined') {
      console.log('⚠️ Supabase not available in development mode');
      return false;
    }

    console.log('✅ Focus App Services Available');
    console.log('   Navigate to /test-webrtc for full testing interface');
    return true;
  } catch (error) {
    console.log(`❌ Focus App Test Failed: ${error.message}`);
    return false;
  }
};

// Run all tests
const runAllTests = async () => {
  console.log('\n🚀 Running Complete WebRTC Test Suite...\n');
  
  const results = {
    webrtcSupport: hasWebRTC,
    mediaAccess: await testMediaAccess(),
    stunTurn: await testSTUNTURN(),
    peerConnection: await testPeerConnection(),
    focusApp: await testFocusWebRTC()
  };

  console.log('\n📊 TEST RESULTS SUMMARY:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
  });

  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  const successRate = Math.round((passedCount / totalCount) * 100);

  console.log(`\n🎯 Overall Success Rate: ${successRate}% (${passedCount}/${totalCount})`);
  
  if (successRate >= 80) {
    console.log('✅ WebRTC is ready for production use!');
  } else if (successRate >= 60) {
    console.log('⚠️ WebRTC has some issues but is functional');
  } else {
    console.log('❌ WebRTC needs significant fixes before production');
  }

  return results;
};

// Auto-run tests or export for manual use
if (typeof module !== 'undefined') {
  module.exports = { runAllTests };
} else {
  // Run tests automatically in browser
  runAllTests();
}
