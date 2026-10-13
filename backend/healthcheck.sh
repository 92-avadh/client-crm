#!/bin/sh
# Healthcheck script for Docker
wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1