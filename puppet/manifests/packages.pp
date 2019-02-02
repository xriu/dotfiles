# Define function
define download_file($source = '', $cwd = '') {

    exec { $name:
      command => "wget -O ${name} ${source}",
      cwd     => $cwd,
      path    => '/usr/bin',
      creates => "${cwd}/${name}",
      require => Package['wget'],
      user    => 'undefined',
    }

}

# Packages to install
class packages_install {

  # Update apt repository

  exec { 'apt-get-update':
    command => '/usr/bin/sudo /usr/bin/apt-get update',
  }

  # Common

  $common = [
    'git',
    'gcc',
    'g++',
    'make',
    'software-properties-common',
    'curl',
    'htop',
    'ssh',
    'screen',
    'tree',
    'build-essential',
    'dialog',
    'libssl-dev',
    'apt-transport-https',
    'lsb-release',
    'ca-certificates',
    'jq',
    'unzip',
    'wget',
    'meld',
    'nano',
    'terminator'
  ]

  package { $common:
    require => Exec['apt-get-update'],
  }

  # AWS CLI

  package { ['awscli']:
    require => Exec['apt-get-update'],
  }

  # PYTHON PIP

  package { ['python-pip']:
    require => Exec['apt-get-update'],
  }

  # JAVA JDK

  package { ['openjdk-8-jdk']:
    require => Exec['apt-get-update'],
  }

  # Dropbox

  package { ['nautilus-dropbox']:
    require => Exec['apt-get-update'],
  }

  # VPN

  package { ['network-manager-openvpn-gnome', 'openvpn']:
    require => Exec['apt-get-update'],
  }

  # Google Chrome

  package { ['google-chrome-stable']:
    require => Exec['apt-get-update'],
  }

  # VS Code

  package { ['code']:
    require => Exec['apt-get-update'],
  }

  # Node / Yarn

  package { ['nodejs', 'yarn']:
    require => Exec['apt-get-update'],
  }

  # Remmina

  package { ['remmina']:
    require => Exec['apt-get-update'],
  }

  # Ansible

  package { ['ansible']:
    require => Exec['apt-get-update'],
  }

  # Docker CE

  package { ['docker-ce']:
    require => Exec['apt-get-update'],
  }

  # Zsh

  package { ['zsh']:
    require => Exec['apt-get-update'],
  }

}

include packages_install
