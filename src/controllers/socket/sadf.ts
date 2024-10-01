// removeTimeOut(user.id);


//             if (!params.data.id) {
//                 await saveLogInDB(GAME_SOCKET_ERROR.EVENT.GAME.NOT_EXIST.CODE, GAME_SOCKET_ERROR.EVENT.GAME.NOT_EXIST.MESSAGE, { room_id: params.data.id, user_id: user.id });
//                 return inValidRoom(socket);
//             }


//             const room_id = params.data.id;

//             try {
//                 // 방 정보
//                 const [roomResult] = await pool.query(GAME_QUERY['roomInfo'], room_id);

//                 // 게임방 유효성 검사
//                 if (roomResult.length < 1) {
//                     await saveLogInDB(GAME_SOCKET_ERROR.EVENT.GAME.NOT_EXIST.CODE, GAME_SOCKET_ERROR.EVENT.GAME.NOT_EXIST.MESSAGE);
//                     return inValidRoom(socket);
//                 }



//                 // 게임방에 참여한 유저 정보 가져오기
//                 const [playersResult] = await pool.query(GAME_QUERY['players'], [room_id],);

//                 // 유저 정보 중 나의 정보를 색출
//                 const myInfo = playersResult
//                     .filter(item => item.user_id === user.id)
//                     .map(({ user_id, hand, ...item }) => {
//                         const handArr = hand ? hand.split(",") : '';
//                         return {
//                             hand: handArr,
//                             card_length: handArr.length,
//                             ...item
//                         }
//                     });

//                 // 클라이언트에서 보낸 값과 실제 유저가 있는 방이 다르면 오류
//                 if (!myInfo.length) {
//                     await saveLogInDB(GAME_SOCKET_ERROR.EVENT.GAME.NOT_EXIST_USER_IN_ROOM.CODE, GAME_SOCKET_ERROR.EVENT.GAME.NOT_EXIST_USER_IN_ROOM.MESSAGE);
//                     return inValidRoom(socket);
//                 }


//                 // 다른 유저들 순서 정렬
//                 const oderPlayersResult = await shiftElementToMiddle(playersResult, user.id);

//                 // 다른 유저들 정보 필터
//                 const oderPlayers = oderPlayersResult
//                     .map(({ hand, user_id, ...item }) => {
//                         const handArr = hand ? hand.split(",") : '';
//                         return {
//                             card_length: handArr.length,
//                             ...item
//                         }
//                     });



//                 const { current_card_user_id, ...roomInfo } = roomResult[0]
//                 roomInfo.current_card = roomInfo.current_card ? roomInfo.current_card.split(",") : roomInfo.current_card;


//                 // 게임이 시작 중 아닐 때 대기방으로 이동
//                 if (roomInfo.status === 0) return socket.emit('alert message', { message: '게임중이 아닙니다. 대기방으로 이동합니다.', button_set: `r${roomInfo.id}` });


//                 // 바닥에 카드가 있다면 낸 유저의 이름을 가져옴.
//                 if (current_card_user_id !== null) {
//                     const [getCurrentCardForRoomResult] = await pool.query(GAME_QUERY['getCurrentCardForRoom'], room_id);
//                     roomInfo.current_card_user_name = getCurrentCardForRoomResult[0].name;
//                 }


//                 // 타이머 설정
//                 // console.log(myInfo[0].status)
//                 if (myInfo[0].status !== 3 && !gameController.existTimer(room_id)) {
//                     const index = playersResult.findIndex(element => element.is_turn === 1);
//                     if (index === -1) return;
//                     const player = playersResult[index];

//                     gameController.setGameTimer(game, room_id, roomInfo.time, player.user_id)
//                 }

//                 let elapsedTime = 0;
//                 if (gameController.existTimer(room_id)) {
//                     elapsedTime = gameController.getGameTimer(room_id)
//                 }


//                 socket.uuid = myInfo[0].uuid
//                 socket.room_id = room_id;


//                 // 연결 끊김 처리 취소 (=재연결)
//                 if (myInfo[0].status === -1) {
//                     await idleController.changeUserStatus(socket, user, { data: { status: 0 } });
//                     game.to(`game-${room_id}`).emit('user disconnect', { uuid: myInfo[0].uuid, status: 0 });
//                 }

//                 const data = {
//                     roomInfo,
//                     userList: oderPlayers,
//                     myInfo: myInfo[0],
//                     elapsedTime
//                 }