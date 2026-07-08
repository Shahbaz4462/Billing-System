# Sargodha Sweets and Bakers - System Setup Guide

This system is designed to work **100% offline** within your local network (LAN).

## 1. Single Computer Setup
If you are using only one computer for both management and billing:
1. Simply open the application or the built HTML file in any modern web browser (Chrome/Edge recommended).
2. All data is saved automatically to that computer's local storage.
3. You can use it without any internet connection.

## 2. Multi-Computer Setup (LAN)
If you want to use 2 or 3 systems (e.g., one for the Owner and two for Billing Counters) and share data in real-time:

### A. The "Main" Computer (Server)
Choose one computer to be the "Server" (usually the Owner's PC).
1. This PC must host the application.
2. In a production environment, you would run a small Node.js server on this PC that connects to a real database (SQLite or PostgreSQL).
3. For this React version to share data, it needs to be served from this Main PC.

### B. Connecting Other Computers
1. Ensure all computers are connected to the same Wi-Fi or Ethernet router.
2. Find the **Local IP Address** of the Main PC (e.g., `192.168.1.10`).
3. On the other computers (Billing Counters), open the browser and type the IP address of the Main PC.
4. Now, any bill created on Counter 1 will immediately show up on the Owner's PC and Counter 2.

### C. Synchronization Options
For real-time sync across multiple systems without internet:
- **Option 1 (Recommended):** Use a **Local Database Server** (Node.js + SQLite). This ensures that if System A changes a price, System B sees it instantly.
- **Option 2 (Simple):** Use the **Backup/Restore** feature in Settings to manually move data between systems if they are not networked.

---

## Technical Note for Multi-PC Sync
Since this is currently a Frontend-only React application, it uses `localStorage` which is unique to each browser. 
**To enable real-time sync between 3 physical computers, you must:**
1. Connect the Frontend to a **Backend API**.
2. Run that API on your Main PC.
3. The API will store everything in a single `database.sqlite` file on the Main PC.
4. All 3 computers will send/receive data from that one file over your local network.
