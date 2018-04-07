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
    'curl',
    'htop',
    'ssh',
    'screen',
    'tree',
    'build-essential',
    'libssl-dev',
    'apt-transport-https',
    'lsb-release',
    'python-software-properties',
    'software-properties-common',
    'ca-certificates',
    'jq',
    'unzip',
    'wget',
    'meld',
    'nano',
  ]

  package { $common:
    require => Exec['apt-get-update'],
  }

  # AWS CLI

  package { ['python','python-pip']:
    require => Exec['apt-get-update'],
  }

  # Dropbox

  package { ['python-gobject-2', 'python-gtk2']:
    require => Exec['apt-get-update'],
  }

  # VPN

  package { ['network-manager-vpnc', 'network-manager-vpnc-gnome', 'openvpn']:
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

  # Others
  # openjdk-8-jdk nginx

}

include packages_install
