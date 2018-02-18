#!/bin/sh

TITLE=$(xdotool getwindowfocus getwindowname)
TITLEnd=$(free -m)

if [ ! $TITLE ]
	then
  		exit 0;
	else
		wmctrl -r :ACTIVE: -T "urxvt | $TITLEnd"	
fi

