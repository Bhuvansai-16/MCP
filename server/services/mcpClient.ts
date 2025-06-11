import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface MCPServer {
  name: string;
  command: string;
  args: string[];
  process?: ChildProcess;
  connected: boolean;
}

export class MCPClient extends EventEmitter {
  private servers: Map<string, MCPServer> = new Map();

  constructor() {
    super();
    this.initializeServers();
  }

  private initializeServers() {
    const serverConfigs = [
      {
        name: 'filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp/mcp-allowed'],
      },
      {
        name: 'fetch',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-fetch'],
      },
      {
        name: 'memory',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-memory'],
      },
      {
        name: 'sequential_thinking',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
      },
    ];

    serverConfigs.forEach(config => {
      this.servers.set(config.name, {
        ...config,
        connected: false,
      });
    });
  }

  async connectServer(serverName: string): Promise<boolean> {
    const server = this.servers.get(serverName);
    if (!server) {
      throw new Error(`Server ${serverName} not found`);
    }

    try {
      const process = spawn(server.command, server.args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      server.process = process;
      server.connected = true;

      process.on('error', (error) => {
        console.error(`MCP Server ${serverName} error:`, error);
        server.connected = false;
      });

      process.on('exit', (code) => {
        console.log(`MCP Server ${serverName} exited with code ${code}`);
        server.connected = false;
      });

      this.servers.set(serverName, server);
      return true;
    } catch (error) {
      console.error(`Failed to connect to MCP server ${serverName}:`, error);
      return false;
    }
  }

  async disconnectServer(serverName: string): Promise<void> {
    const server = this.servers.get(serverName);
    if (server?.process) {
      server.process.kill();
      server.connected = false;
    }
  }

  async callTool(serverName: string, toolName: string, args: any): Promise<any> {
    const server = this.servers.get(serverName);
    if (!server?.connected) {
      throw new Error(`Server ${serverName} not connected`);
    }

    // Simulate MCP tool call - in real implementation, this would use the MCP protocol
    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args,
        },
      };

      const requestStr = JSON.stringify(request) + '\n';
      
      if (server.process?.stdin) {
        server.process.stdin.write(requestStr);
      }

      // Mock response for demo
      setTimeout(() => {
        resolve({
          content: [
            {
              type: 'text',
              text: `Mock response from ${serverName}:${toolName} with args: ${JSON.stringify(args)}`,
            },
          ],
        });
      }, 100);
    });
  }

  async listTools(serverName: string): Promise<any[]> {
    const server = this.servers.get(serverName);
    if (!server?.connected) {
      throw new Error(`Server ${serverName} not connected`);
    }

    // Mock tools list - in real implementation, this would query the MCP server
    const mockTools = {
      filesystem: [
        { name: 'read_file', description: 'Read file contents' },
        { name: 'write_file', description: 'Write file contents' },
        { name: 'list_directory', description: 'List directory contents' },
      ],
      fetch: [
        { name: 'fetch', description: 'Fetch URL content' },
      ],
      memory: [
        { name: 'store', description: 'Store information in memory' },
        { name: 'retrieve', description: 'Retrieve information from memory' },
      ],
      sequential_thinking: [
        { name: 'think', description: 'Sequential thinking process' },
      ],
    };

    return mockTools[serverName as keyof typeof mockTools] || [];
  }

  getServerStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.servers.forEach((server, name) => {
      status[name] = server.connected;
    });
    return status;
  }

  async disconnectAll(): Promise<void> {
    for (const [name] of this.servers) {
      await this.disconnectServer(name);
    }
  }
}

export const mcpClient = new MCPClient();