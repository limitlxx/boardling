# Zcash Paywall SDK - Logs

This directory contains application logs for the Zcash Paywall SDK.

## Log Files

The application generates several types of logs:

```
logs/
├── README.md           # This file
├── app.log            # General application logs
├── error.log          # Error logs only
├── access.log         # HTTP access logs
├── zcash.log          # Zcash RPC interaction logs
└── audit.log          # Security and audit logs
```

## Log Levels

The application uses the following log levels:

- **ERROR**: Error conditions that need immediate attention
- **WARN**: Warning conditions that should be monitored
- **INFO**: General information about application operation
- **DEBUG**: Detailed information for debugging (development only)

## Log Configuration

Configure logging via environment variables:

```env
LOG_LEVEL=info          # error, warn, info, debug
LOG_TO_FILE=true        # Enable file logging
LOG_TO_CONSOLE=true     # Enable console logging
LOG_MAX_SIZE=10mb       # Maximum log file size
LOG_MAX_FILES=5         # Number of rotated files to keep
```

## Log Rotation

Logs are automatically rotated when they reach the maximum size. Old logs are compressed and stored with timestamps.

Example rotated files:
```
app.log
app.log.1.gz
app.log.2.gz
app.log.3.gz
```

## Log Monitoring

### Viewing Live Logs
```bash
# Follow all logs
tail -f logs/app.log

# Follow error logs only
tail -f logs/error.log

# Search for specific patterns
grep "ERROR" logs/app.log
grep "payment" logs/app.log | tail -20
```

### Log Analysis
```bash
# Count error types
grep "ERROR" logs/app.log | cut -d' ' -f4- | sort | uniq -c

# Monitor API response times
grep "duration" logs/app.log | awk '{print $NF}' | sort -n

# Check payment activity
grep "invoice\|withdrawal" logs/app.log | tail -50
```

## Important Log Patterns

### Successful Operations
```
[INFO] Invoice created: invoice_id=uuid amount=1.5 ZEC
[INFO] Payment detected: invoice_id=uuid txid=hash
[INFO] Withdrawal processed: withdrawal_id=uuid amount=1.0 ZEC
```

### Error Conditions
```
[ERROR] Database connection failed: connection timeout
[ERROR] Zcash RPC error: method not found
[ERROR] Withdrawal failed: insufficient balance
```

### Security Events
```
[WARN] Rate limit exceeded: ip=192.168.1.1
[WARN] Invalid authentication attempt
[ERROR] SQL injection attempt detected
```

## Log Retention

- **Development**: Logs kept for 7 days
- **Production**: Logs kept for 90 days
- **Audit logs**: Kept for 1 year minimum

## Security Considerations

- Logs may contain sensitive information
- Never log private keys or passwords
- Sanitize user input in logs
- Restrict log file access permissions
- Consider log encryption for production

## Monitoring and Alerts

Set up alerts for:
- High error rates
- Database connection failures
- Zcash RPC failures
- Unusual payment patterns
- Security events

### Example Alert Queries
```bash
# High error rate (>10 errors in 5 minutes)
grep "ERROR" logs/app.log | tail -100 | grep "$(date -d '5 minutes ago' '+%Y-%m-%d %H:%M')"

# Failed payments
grep "payment.*failed" logs/app.log

# Suspicious activity
grep -E "(rate.limit|invalid.*auth|injection)" logs/app.log
```

## Log Cleanup

Automated cleanup script (add to cron):
```bash
#!/bin/bash
# Clean logs older than 90 days
find logs/ -name "*.log.*" -mtime +90 -delete

# Compress large current logs
find logs/ -name "*.log" -size +100M -exec gzip {} \;
```

## Development vs Production

### Development
- Higher log verbosity (DEBUG level)
- Console output enabled
- Shorter retention period
- Less strict security

### Production
- Lower log verbosity (INFO level)
- File output only
- Longer retention period
- Strict access controls
- Log aggregation to centralized system

## Troubleshooting with Logs

### Common Issues

1. **Database Connection Problems**
   ```bash
   grep -i "database\|pool\|connection" logs/error.log
   ```

2. **Zcash RPC Issues**
   ```bash
   grep -i "zcash\|rpc" logs/error.log
   ```

3. **Payment Processing Errors**
   ```bash
   grep -i "invoice\|payment\|withdrawal" logs/error.log
   ```

4. **Performance Issues**
   ```bash
   grep "duration" logs/app.log | awk '{print $NF}' | sort -nr | head -20
   ```

## Log Format

Standard log format:
```
[TIMESTAMP] LEVEL: MESSAGE {metadata}
```

Example:
```
[2025-01-15T10:30:45.123Z] INFO: Invoice created {"invoice_id": "uuid", "amount": 1.5, "user_id": "uuid"}
```
