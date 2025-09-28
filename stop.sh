#!/bin/bash

# 🛑 Multi-Tenant QR Menu System - Graceful Stop Script
# Following Emad's Startup Script Robustness Requirements

# Color codes for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🛑 Stopping Multi-Tenant QR Menu System${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"

# Configuration
FRONTEND_PORT=3000
API_PORT=3001

# Function: Stop server by PID file
stop_by_pid() {
    if [ -f ".dev-server.pid" ]; then
        PID=$(cat .dev-server.pid)
        echo -e "${YELLOW}🔄 Stopping server with PID: $PID...${NC}"
        
        if kill -0 $PID 2>/dev/null; then
            kill -TERM $PID 2>/dev/null
            sleep 3
            
            # Force kill if still running
            if kill -0 $PID 2>/dev/null; then
                echo -e "${YELLOW}  Force killing process...${NC}"
                kill -9 $PID 2>/dev/null
            fi
        fi
        
        rm .dev-server.pid
        echo -e "${GREEN}✅ Server stopped via PID file${NC}"
    else
        echo -e "${YELLOW}⚠️ No PID file found${NC}"
    fi
}

# Function: Kill processes on ports
kill_port_processes() {
    echo -e "${YELLOW}🔄 Cleaning processes on ports...${NC}"
    
    for port in $FRONTEND_PORT $API_PORT; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "${YELLOW}  Killing process on port $port...${NC}"
            lsof -Pi :$port -sTCP:LISTEN -t | xargs kill -TERM 2>/dev/null || true
            sleep 2
            
            # Force kill if still running
            if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
                echo -e "${YELLOW}  Force killing process on port $port...${NC}"
                lsof -Pi :$port -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
            fi
        fi
    done
}

# Function: Kill Next.js processes
kill_nextjs_processes() {
    echo -e "${YELLOW}🔄 Cleaning Next.js processes...${NC}"
    
    # Kill any Next.js processes
    pkill -TERM -f "next dev" 2>/dev/null || true
    pkill -TERM -f "next-server" 2>/dev/null || true  
    pkill -TERM -f "node.*next" 2>/dev/null || true
    
    sleep 3
    
    # Force kill if still running
    pkill -9 -f "next dev" 2>/dev/null || true
    pkill -9 -f "next-server" 2>/dev/null || true
    pkill -9 -f "node.*next" 2>/dev/null || true
}

# Function: Verify cleanup
verify_cleanup() {
    echo -e "${BLUE}🔍 Verifying cleanup...${NC}"
    
    local processes_found=false
    
    for port in $FRONTEND_PORT $API_PORT; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "${RED}❌ Process still running on port $port${NC}"
            processes_found=true
        else
            echo -e "${GREEN}✅ Port $port is free${NC}"
        fi
    done
    
    if [ "$processes_found" = true ]; then
        echo -e "${RED}❌ Some processes are still running${NC}"
        return 1
    else
        echo -e "${GREEN}✅ All processes stopped successfully${NC}"
        return 0
    fi
}

# Main execution
main() {
    # Step 1: Stop by PID file
    stop_by_pid
    
    # Step 2: Kill processes on ports
    kill_port_processes
    
    # Step 3: Kill Next.js processes
    kill_nextjs_processes
    
    # Step 4: Verify cleanup
    if verify_cleanup; then
        echo -e "\n${GREEN}🎉 Multi-Tenant QR Menu System Stopped Successfully!${NC}"
        echo -e "${BLUE}💡 To start again, run: ${YELLOW}./start.sh${NC}"
    else
        echo -e "\n${YELLOW}⚠️ Some processes may still be running${NC}"
        echo -e "${BLUE}💡 You may need to manually kill remaining processes${NC}"
    fi
}

# Execute main function
main "$@"