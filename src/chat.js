console.log('Chat Start!');
import { off, onChildAdded, push, ref, set } from "firebase/database";
import { addDoc, collection, deleteDoc, deleteField, doc, getDoc, onSnapshot, onSnapshotsInSync, setDoc, updateDoc } from "firebase/firestore";
import { dbRealtime, dbFirestore } from "./index"; // index.jsでexport宣言した変数dbをimport宣言で使えるようにする

class Chat {
    constructor() {
        // HTMLの要素を取得する
        this.username = document.querySelector('#username');
        this.message = document.querySelector('#message');
        this.chatBord = document.querySelector('#chat-bord');
        this.sendButton = document.querySelector('#send-button');

        // refは、引数で指定した文字列のキーを作って返す
        this.postsRef = ref(dbRealtime, 'posts/');

        // 送信ボタンに関数を設定
        this.sendButton.addEventListener('click', () => {
            if (this.username.value === '' || this.message.value === '') {
                console.log("入力してください");
                return;
            }

            console.log(this.username.value);
            console.log(this.message.value);

            // pushは、新しいキーを生成してデータを書き込む
            const newPostRef = push(this.postsRef); // 今回は、データを書き込まずにキーを取得する

            // setは、指定したキーにデータを書き込む
            // すでに存在するキーに書き込んだときは、上書きする
            set(newPostRef, {
                username: this.username.value,
                message: this.message.value,
            });
        });

        // チャット履歴を追記する
        // onChildAddedは、追加されたオブジェクトをひとつづつ取得する
        onChildAdded(this.postsRef, snapshot => {
            // val()でデータを取得する
            const data = snapshot.val();

            const liusername = document.createElement('li');
            const limessage = document.createElement('li');

            this.chatBord.appendChild(liusername);
            this.chatBord.appendChild(limessage);

            liusername.innerText = data['username'];
            limessage.innerText = data['message'];
        });
    }
}

class VideoChat {
    constructor() {
        console.log("Video chat Start!")

        this.configuration = {
            iceServers: [
                {
                    urls: [
                        'stun:stun1.1.google.com:19302',
                        'stun:stun2.1.google.com:19302',
                    ],
                },
            ],
            iceCAndidatePoolSize: 10,
        };
        this.initialize();
    }

    initialize() {
        // bind(this)をすることで呼び出し元をこのVideoChatクラスにする
        document.querySelector('#camera-button').addEventListener('click', this.openUserMedia.bind(this));
        document.querySelector('#create-button').addEventListener('click', this.createRoom.bind(this));
        document.querySelector('#join-button').addEventListener('click', this.joinRoom.bind(this));
    }

    async openUserMedia() {
        // 「カメラとマイクを有効化する」ボタンを押したら、このボタンを無効化して、他の無効だったボタンを有効化する
        document.querySelector('#camera-button').disabled = true;
        document.querySelector('#join-button').disabled = false;
        document.querySelector('#create-button').disabled = false;
        document.querySelector('#hangup-button').disabled = false;

        // 自分と相手が映るVideo要素を取得する
        const localVideo = document.querySelector('#local-video');
        const remoteVideo = document.querySelector('#remote-video');

        // カメラとマイクを有効化する
        this.localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        localVideo.srcObject = this.localStream;

        // 相手を映すストリームを作る
        this.remoteStream = new MediaStream();
        remoteVideo.srcObject = this.remoteStream;

        // ストリームの情報をログ出力する
        console.log('LocalStream: ', localVideo.srcObject);
        console.log('RemoteStream: ', remoteVideo.srcObject);
    }

    async createRoom() {
        // 「部屋をつくる」ボタンを押したら、このボタンを押せないように無効化して、「部屋に接続する」ボタンも押せないように無効化する
        document.querySelector('#create-button').disabled = true;
        document.querySelector('#join-button').disabled = true;

        // ピア接続の構成をログ出力する
        console.log('Create PeerConnection with configuration: ', this.configuration);
        this.peerConnection = new RTCPeerConnection(this.configuration);

        // イベントにコールバックを登録する
        this.registerPeerConnectionListeners();

        // ピア接続のトラックにローカルストリームのカメラとマイクのトラックを追加する
        this.localStream.getTracks().forEach((track) => {
            console.log('Track a LocalStream: ', track);
            const sender = this.peerConnection.addTrack(track, this.localStream);
            console.log(sender);
        });

        // Firestoreのリファレンスを作る
        // 「roomsコレクション > 新しい一意なドキュメント」のリファレンス
        const roomDoc = doc(collection(dbFirestore, 'rooms'));
        // 「roomsコレクション > 新しい一意なドキュメント > callerCandidatesコレクション」のリファレンス
        const callerCandidatesCollection = collection(roomDoc, 'callerCandidates');

        this.peerConnection.addEventListener('icecandidate', (e) => {
            if (!e.candidate) {
                console.log('Got final candidate!');
                return;
            }
            console.log('Got candidate: ', e.candidate);
            // 新しい一意なIDのドキュメントを作り、そこにデータを追加する
            // roomsコレクション > 一意なIDのドキュメント > callerCandidatesコレクション > 新しい一意なドキュメント > event.candidate.toJSONのデータ
            addDoc(callerCandidatesCollection, e.candidate.toJSON());
        });

        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        console.log('Created offer: ', offer);

        const roomWithOffer = {
            offer: {
                type: offer.type,
                sdp: offer.sdp,
            },
        };
        await setDoc(roomDoc, roomWithOffer);
        this.roomId = roomDoc.id;
        console.log(`New room created with SDP offer. Room ID: &{roomDoc.id}`);
        document.querySelector('#currentRoom').innerText = `Current room is ${roomDoc.id} - You are the caller!`;

        this.peerConnection.addEventListener('track', (e) => {
            console.log('Got remote track:', e.streams[0]);
            e.streams[0].getTracks().forEach((track) => {
                console.log('Add a track to the remoteStream:', track);
                this.remoteStream.addTrack(track);
            });
        });

        onSnapshot(roomDoc, async (snapshot) => {
            // 部屋IDのドキュメントの更新されたデータをログ出力する
            console.log('Got updated romm:', snapshot.data());
            // スナップショットからデータを取得する
            const data = snapshot.data();
            // 現在のピア接続のリモート説明が存在しないかつData.answerが存在する
            if (!this.peerConnection.currentRemoteDescription && data?.answer) {
                console.log('Got remote description: ', data.answer);
                // RTCセッションアンサーを作成する
                const rtcSessionDescription = new rtcSessionDescription(data.answer);
                // アンサーをもとにコレクションを行う
                await this.peerConnection.setRemoteDescription(rtcSessionDescription);
            }
        });

        const calleeCandidateCollection = collection(roomDoc, 'calleeCandidates');
        onSnapshot(calleeCandidateCollection, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
                    await this.peerConnection.addIceCandidate(new RTCIceCandidate(data));
                }
            });
        });
    }

    joinRoom() {
        document.querySelector('#create-button').disabled = true;
        document.querySelector('#join-button').disabled = true;

        const cancelButton = document.querySelector('#cancel-button');
        const confirmJoinButton = document.querySelector('#confirm-join-button');
        const roomDialog = document.querySelector('#room-dialog');

        // キャンセルボタンを押したときにダイアログを閉じる
        cancelButton.addEventListener('click', () => {
            roomDialog.close();
        });
        // 確定ボタンを押したときの処理
        confirmJoinButton.addEventListener('click', async () => {
            this.roomId = document.querySelector('#room-id').value;
            console.log('Join room: ', this.roomId);

            document.querySelector('#current-room').innerText = `現在の部屋は${this.roomId} - あなたは受信者です。呼び出された人です。`;
            const output = document.querySelector('output');
            output.value = this.roomId;
            await joinRoomById(this.roomId);
        });

        roomDialog.showModal();
    }

    async joinRoomById(roomId) {
        const roomsCollectionRef = collection(dbFirestore, 'rooms');
        const roomDocRef = doc(roomsCollectionRef, `${roomId}`);
        const roomSnapshot = await getDoc(roomDocRef);
        console.log('Got room:', roomSnapshot.exists);

        if (roomSnapshot.exists) {
            console.log('Create PeerConnection with configuration: ', this.configuration);
            this.peerConnection = new RTCPeerConnection(this.configuration);
            this.registerPeerConnectionListeners();
            this.localStream.getTracks().forEach((track) => {
                this.peerConnection.addTrack(track, this.localStream);
            });

            const calleeCandidateCollectionReference = collection(roomDocRef, 'calleeCandidates');
            this.peerConnection.addEventListener('icecandidate', (e) => {
                if (!e.candidate) {
                    console.log('Got final candidate!');
                    return;
                }
            });

            this.peerConnection.addEventListener('track', (e) => {
                console.log('Got remote track:', e.streams[0]);
                e.streams[0].getTracks().forEach((track) => {
                    console.log('Add a track to the remoteStream:', track);
                    this.remoteStream.addTrack(track);
                });
            });

            const offer = roomSnapshot.data().offer;
            console.log('Got offer:', offer);
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await this.peerConnection.createAnswer();
            console.log('Created answer:', answer);
            await this.peerConnection.setLocalDescription(answer);

            const roomWithAnswer = {
                answer: {
                    type: answer.type,
                    sdp: answer.sdp,
                },
            };
            await updateDoc(roomDocRef, 'roomWithAnswer');

            onSnapshot(calleeCandidateCollectionReference, (snapshot) => {
                snapshot.docChanges().forEach(async (change) => {
                    if (change.type === 'added') {
                        const data = change.doc.data();
                        console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
                        await this.peerConnection.addEventListener(new RTCIceCandidate(data));
                    }
                });
            });
        }
    }

    registerPeerConnectionListeners() {
        this.peerConnection.addEventListener('icegatheringstatechange', () => {
            console.log(`ICE gathering state changed: ${this.peerConnection.connectionState}`);
        });

        this.peerConnection.addEventListener('connectionstatechange', () => {
            console.log(`Connection state change: ${this.peerConnection.connectionState}`);
        });

        this.peerConnection.addEventListener('signalingstatechange', () => {
            console.log(`ICE connection state change: ${this.peerConnection.iceConnectionState}`);
        });

        this.peerConnection.addEventListener('iceconnectionstatechange', () => {
            console.log(`ICE connection state change: ${this.peerConnection.iceConnectionState}`);
        });
    }

    async hungup() {
        const tracks = document.querySelector('#local-video').srcObject.getTracks();
        tracks.forEach((track) => {
            track.stop();
        });

        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach((track) => track.stop());
        }

        if (this.peerConnection) {
            this.peerConnection.close();
        }

        document.querySelector('local-video').srcObject = null;
        document.querySelector('#remote-video').srcObject = null;
        document.querySelector('#camera-button').disabled = false;
        document.querySelector('#join-button').disabled = false;
        document.querySelector('#hangup-butoon').disabled = true;
        document.querySelector('#current-room').innerText = '';

        if (this.roomId) {
            const roomDocRef = doc(collection(dbFirestore, 'rooms'), this.roomId);
            const calleeCandidates = (await getDoc(doc(collection(roomDocRef, 'calleeCandidates')))).data();
            calleeCandidates.forEach(async (candidate) => {
                await deleteDoc(candidate.ref);
            });

            await deleteDoc(roomDocRef);
        }

        document.location.reload();
    }
}

new Chat();
new VideoChat();