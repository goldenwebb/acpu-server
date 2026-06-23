# acpu-server is a simple signaling server for AnimationCPU

SPDX-License-Identifier: MIT
Copyright (C) 2012-2050 Victor Kozub <victor.space@protonmail.com>

Experimental

## Features
- Boot a startup project
- Signaling server to sync shared memory through WebSockets
- Host media data
- Does not store user data, just messaging for public usage
- No encryption

## Documentation
- Use LiveComment to view the architecture

## Launch
1. Create `.env` (see `.env.example`) for your acpul project.
   `BASE` is the path to your acpul project:

```
BASE='~/src/acpu-core'
```

2. Run:

```
node acpu-server.js
```

3. Open: http://localhost:8455/ to see runtime internals

## TODO
- TODO: Add Contributing guide
- TODO: Add Developer Agreement (see `apple.sh`)

## Sponsorship

Looking for sponsors to help fund development, hosting and maintenance.

| Asset | Network | Address |
| --- | --- | --- |
| BTC | Bitcoin | `18Bth1u3pSJzPrCf21tx1F6iSzA2fgKdfU` |
| ETH | Ethereum | `0x072c709a8Ad95Fc182e0E2EEF834C3d944122f0b` |
| USDT | Ethereum (ERC-20) | `0x072c709a8Ad95Fc182e0E2EEF834C3d944122f0b` |
| SOL | Solana | `9gLVQr97baX3KrG9DyaUDd5FwXaiLcDuU6CK5RCNMnWu` |
| DOGE | Dogecoin | `DJP8425i4sGT4tSEXwEDRPJb4vJBGroJs6` |
| LTC | Litecoin | `ltc1q69gg9udgqnky60n7mfzfaj0w7lu80ujx6fysly` |
| TRX | Tron | `TLjkoQfnu7aRRbVRkEYN1vZPzW7ntuM4tn` |

Contact: victor.space@protonmail.com
