const signalingServer = new WebSocket('ws://10.9.24.4:3000');
const peerConnection = new RTCPeerConnection();
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

// Get local media (camera/microphone)
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        localVideo.srcObject = stream;
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    })
    .catch(console.error);

// Handle remote media
peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
};

// Send ICE candidates to the signaling server
peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
        signalingServer.send(JSON.stringify({ candidate: event.candidate }));
    }
};

// Listen for messages from the signaling server
signalingServer.onmessage = async (message) => {
    const data = JSON.parse(message.data);

    if (data.offer) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        signalingServer.send(JSON.stringify({ answer }));
    } else if (data.answer) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    } else if (data.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
};

// Create and send an offer
async function startCall() {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    signalingServer.send(JSON.stringify({ offer }));
}

// Start call on user action
signalingServer.onopen = () => {
    console.log("Connected to the signaling server.");
    if (confirm("Do you want to start the call?")) {
        startCall();
    }
};