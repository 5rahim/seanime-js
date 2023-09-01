# Config

## MPC-HC

- Go to `Options > Web Interface`
- Check the box for **Listen on port** `13579`

## VLC

- Go to `Tools > Preferences`
- Bottom left `Show settings` to **All**
- Sidebar `Interfaces > Main interfaces`
- Check the box for **Web**
- Go to `Interfaces > Main interfaces > Lua`
- Under `Lua HTTP`, set password to `seanime`

**Redo this process after updates.

## qBittorent

- Go to `Options > Web UI`
- Check the box for **Web User Interface (Remove Control)**
- Change the port to **8081** so that it does not conflict with VLC
- **Bypass authentication for clients on localhost**
- Disable **Enable clickjacking protection**
- Disable **Enable CSRF protection**
