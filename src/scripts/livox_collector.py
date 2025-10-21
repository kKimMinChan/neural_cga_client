# collectors/livox_collector.py
# pip install livoxsdk numpy
import argparse, json, sys, time, datetime, math, asyncio
import numpy as np
import livoxsdk

points_buffer = []  # [ [x,y,z,intensity], ... ]

def flush_frame():
    """버퍼에 쌓인 포인트를 한 프레임으로 내보내고 비움"""
    global points_buffer
    if points_buffer:
        sys.stdout.write(json.dumps({"points": points_buffer}) + "\n")
        sys.stdout.flush()
        points_buffer = []

def data_callback(packet: livoxsdk.DataPacket) -> None:
    global points_buffer
    # Cartesian / Spherical 모두 처리
    if packet.header.data_type.coordinate_system.value == livoxsdk.enums.CoordinateSystem.Cartesian:
        for point in packet.payload:
            for s in point:
                if not s.valid():
                    continue
                x = float(s.x) / 1000.0
                y = float(s.y) / 1000.0
                z = float(s.z) / 1000.0
                intensity = int(s.reflectivity)
                points_buffer.append([x, y, z, intensity])
    else:
        for point in packet.payload:
            for s in point:
                if not s.valid():
                    continue
                sintheta = math.sin(float(s.theta) * 0.01 * math.pi / 180.0)
                sinphi   = math.sin(float(s.phi)   * 0.01 * math.pi / 180.0)
                costheta = math.cos(float(s.theta) * 0.01 * math.pi / 180.0)
                cosphi   = math.cos(float(s.phi)   * 0.01 * math.pi / 180.0)
                x = float(s.depth) * cosphi * sintheta / 1000.0
                y = float(s.depth) * sinphi * sintheta / 1000.0
                z = float(s.depth) * costheta / 1000.0
                intensity = int(s.reflectivity)
                points_buffer.append([x, y, z, intensity])

async def run(seconds: float, mode: str, coord: str, flush_interval: float):
    search_time = datetime.timedelta(seconds=3)
    # 장치 검색
    found = await livoxsdk.port_scanner.scan_for_devices(search_time)
    if len(found) < 1:
        # 에러를 stderr로
        sys.stderr.write("No Livox devices detected\n")
        sys.stderr.flush()
        return 1

    info = list(found)[0]
    async with livoxsdk.Lidar(info.ip_address) as lidar:
        lidar.data_callback = data_callback
        await lidar.connect()

        # 좌표계/리턴 모드
        if coord.lower() == "cartesian":
            await lidar.set_coordinate_system(livoxsdk.enums.CoordinateSystem.Cartesian)
        else:
            await lidar.set_coordinate_system(livoxsdk.enums.CoordinateSystem.Spherical)

        if mode.lower() == "strongest":
            await lidar.set_return_mode(livoxsdk.enums.PointCloudReturnMode.StrongestReturn)
        else:
            await lidar.set_return_mode(livoxsdk.enums.PointCloudReturnMode.FirstReturn)

        await lidar.make_ready()
        await lidar.sampling(True)

        t0 = time.time()
        last_flush = t0
        try:
            while True:
                now = time.time()
                if now - t0 >= seconds:
                    break
                if now - last_flush >= flush_interval:
                    flush_frame()
                    last_flush = now
                await asyncio.sleep(0.01)
        finally:
            flush_frame()
            await lidar.sampling(False)

    # 완료 신호
    sys.stdout.write(json.dumps({"event":"done"}) + "\n")
    sys.stdout.flush()
    return 0

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--seconds", type=float, default=0.3, help="capture duration seconds")
    parser.add_argument("--mode", type=str, default="strongest", choices=["strongest","first"])
    parser.add_argument("--coord", type=str, default="cartesian", choices=["cartesian","spherical"])
    parser.add_argument("--flush-interval", type=float, default=0.05, help="JSONL 플러시 주기(초)")
    args = parser.parse_args()
    try:
        exit_code = asyncio.run(run(args.seconds, args.mode, args.coord, args.flush_interval))
        sys.exit(exit_code)
    except Exception as e:
        sys.stderr.write(f"collector error: {e}\n")
        sys.stderr.flush()
        sys.exit(1)

if __name__ == "__main__":
    main()
