#!/bin/bash

function clean() {

    sudo apt-get autoclean
    sudo apt-get clean
    sudo apt-get autoremove

}