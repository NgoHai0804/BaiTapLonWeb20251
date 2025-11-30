import socketio
import time
import threading

sio = socketio.Client()

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDVlODQ0ZmFjZmIzZTg2MGI3NWI2YiIsInVzZXJuYW1lIjoibmdvaGFpIiwiaWF0IjoxNzY0NDg2Njc3LCJleHAiOjE3NjcwNzg2Nzd9.U7rWtaMRriZqcqhSMa80k8Zqfl-JlFarsE1rFN_z3tY"
ROOM_ID = "692beee74613f85f9e49513c"
USER = {"id": "user1", "username": "hai12344"}

# Biến kiểm soát ping
is_connected = False


# =========================
# EVENTS
# =========================
@sio.event
def connect():
    global is_connected
    is_connected = True

    print("✅ Connected!")
    sio.emit("join_room", {"roomId": ROOM_ID, "password": "123"})


@sio.event
def disconnect():
    global is_connected
    is_connected = False

    print("❌ Disconnected")


@sio.on("pong_server")
def on_pong(data):
    print("📨 PONG RECEIVED:", data)


# =========================
# Ping server (5s/lần)
# =========================
def start_ping():
    while True:
        if is_connected:  # Chỉ ping khi đang kết nối
            try:
                sio.emit("ping_server")
                print("📡 Ping sent")
            except Exception as e:
                print("Ping error:", e)
        time.sleep(5)


# =========================
# COMMAND HANDLER (MAIN THREAD)
# =========================
def command_handler():
    print("""
=========================
NHẬP LỆNH ĐỂ TEST GAME:
-------------------------
move x y
ready
start
draw
draw_ok
undo
undo_ok
resign
leave
=========================
""")

    while True:
        cmd = input("> ").strip().split()

        if not cmd:
            continue

        try:
            if cmd[0] == "move":
                sio.emit("player_move", {"x": int(cmd[1]), "y": int(cmd[2])})

            elif cmd[0] == "ready":
                sio.emit("player_ready")

            elif cmd[0] == "start":
                sio.emit("force_start")

            elif cmd[0] == "draw":
                sio.emit("request_draw")

            elif cmd[0] == "draw_ok":
                sio.emit("accept_draw")

            elif cmd[0] == "undo":
                sio.emit("request_undo")

            elif cmd[0] == "undo_ok":
                sio.emit("accept_undo")

            elif cmd[0] == "resign":
                sio.emit("resign")

            elif cmd[0] == "leave":
                sio.emit("leave_room")
                print("🚪 Rời phòng")

            else:
                print("❓ Lệnh không hợp lệ")
        except Exception as e:
            print("⚠ Lỗi khi gửi lệnh:", e)


# =========================
# SOCKET.IO THREAD
# =========================
def start_socket():
    try:
        sio.connect("http://localhost:5000", auth={"token": TOKEN})
        sio.wait()
    except Exception as e:
        print("❌ Socket connect error:", e)


# =========================
# RUN
# =========================
threading.Thread(target=start_socket, daemon=True).start()
threading.Thread(target=start_ping, daemon=True).start()

command_handler()
