const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(__dirname));

// Default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// SSE endpoint for real-time deployment logs
app.get('/api/deploy', (req, res) => {
    console.log('🚀 New deployment request received');
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const scriptPath = path.join(process.env.HOME, '.openclaw/workspace/deploy-joni-aws-final.sh');
    
    console.log('📋 Script path:', scriptPath);
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
        console.error('❌ Deployment script not found');
        res.write(`data: ${JSON.stringify({ 
            type: 'error', 
            message: 'Deployment script not found. Running in demo mode.' 
        })}\n\n`);
        
        // Don't end - let frontend handle demo mode
        setTimeout(() => {
            res.write(`data: ${JSON.stringify({ type: 'complete', success: false })}\n\n`);
            res.end();
        }, 1000);
        return;
    }

    console.log('✅ Starting deployment script...');
    
    const deploy = spawn('bash', [scriptPath], {
        cwd: path.join(process.env.HOME, '.openclaw/workspace'),
        env: { ...process.env },
        shell: true
    });

    let progress = 0;
    const progressMap = {
        'API keys loaded': 5,
        'API keys': 5,
        'Creating SSH': 10,
        'Security group': 15,
        'Launching EC2': 20,
        'Instance created': 25,
        'Instance running': 30,
        'SSH ready': 35,
        'Installing Docker': 40,
        'Docker installed': 50,
        'Cloning JONI': 55,
        'Building Docker': 60,
        'pnpm install': 70,
        'Build complete': 85,
        'Starting JONI': 90,
        'JONI is running': 95,
        'deployment complete': 100,
        'Deployment complete': 100
    };

    deploy.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('STDOUT:', output);

        // Update progress based on keywords
        for (const [keyword, prog] of Object.entries(progressMap)) {
            if (output.toLowerCase().includes(keyword.toLowerCase()) && prog > progress) {
                progress = prog;
                res.write(`data: ${JSON.stringify({ type: 'progress', value: progress })}\n\n`);
                console.log(`📊 Progress: ${progress}%`);
                break;
            }
        }

        // Extract important info
        const instanceMatch = output.match(/Instance ID[:\s]+(i-[a-z0-9]+)/i);
        const ipMatch = output.match(/Public IP[:\s]+([\d.]+)/i);
        const gatewayMatch = output.match(/Gateway[:\s]+(http:\/\/[\d.:]+)/i);

        if (instanceMatch) {
            const instanceId = instanceMatch[1];
            console.log('🆔 Instance:', instanceId);
            res.write(`data: ${JSON.stringify({ type: 'instance', value: instanceId })}\n\n`);
        }
        if (ipMatch) {
            const ip = ipMatch[1];
            console.log('🌐 IP:', ip);
            res.write(`data: ${JSON.stringify({ type: 'ip', value: ip })}\n\n`);
        }
        if (gatewayMatch) {
            const gateway = gatewayMatch[1];
            console.log('🚪 Gateway:', gateway);
            res.write(`data: ${JSON.stringify({ type: 'gateway', value: gateway })}\n\n`);
        }

        // Send log lines
        output.split('\n').forEach(line => {
            if (line.trim() && !line.includes('━')) {
                res.write(`data: ${JSON.stringify({ type: 'log', message: line.trim() })}\n\n`);
            }
        });
    });

    deploy.stderr.on('data', (data) => {
        const error = data.toString();
        console.error('STDERR:', error);
        
        // Send stderr as logs (some tools output to stderr normally)
        error.split('\n').forEach(line => {
            if (line.trim()) {
                res.write(`data: ${JSON.stringify({ type: 'log', message: line.trim() })}\n\n`);
            }
        });
    });

    deploy.on('close', (code) => {
        console.log('🏁 Deployment finished with code:', code);
        
        if (code === 0) {
            res.write(`data: ${JSON.stringify({ type: 'progress', value: 100 })}\n\n`);
            res.write(`data: ${JSON.stringify({ type: 'complete', success: true })}\n\n`);
        } else {
            res.write(`data: ${JSON.stringify({ 
                type: 'complete', 
                success: false, 
                error: `Process exited with code ${code}` 
            })}\n\n`);
        }
        res.end();
    });

    deploy.on('error', (err) => {
        console.error('❌ Spawn error:', err);
        res.write(`data: ${JSON.stringify({ 
            type: 'error', 
            message: `Failed to start deployment: ${err.message}` 
        })}\n\n`);
        res.end();
    });

    req.on('close', () => {
        console.log('🔌 Client disconnected, killing deployment process');
        deploy.kill();
    });
});

app.listen(PORT, () => {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🐙 JONI Deployer Server Running');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log('');
    console.log('💡 Click "Create Account" to deploy JONI to AWS');
    console.log('');
    console.log('Press Ctrl+C to stop');
    console.log('');
});
