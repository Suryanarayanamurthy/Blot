#!/bin/sh
# This is part of the upstart script for Blot so if 
# you move it, make sure to update the upstart script
set -e
set -x 

DEVICE_NAME=nvme0n1

# Ensure we have mounted the file system
mkfs -t xfs /dev/$DEVICE_NAME || true
mount /dev/$DEVICE_NAME $CACHE_DIRECTORY || true
chown -R $BLOT_USER:$BLOT_USER $BLOT_CACHE_DIRECTORY || true