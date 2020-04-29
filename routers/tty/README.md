this directory will hold your pseudo tty devices,  
create PTY using socat, like so  
```
socat PTY,link=./tty/N1,raw,echo=0 -
```

where `N1` corresponds to your nodeID
