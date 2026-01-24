package com.example.project.security;

import com.example.project.model.Users;
import com.example.project.service.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    @Autowired
    UserRepository userRepository;


    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Users user=userRepository.findByUsername(username);
        if (user==null)
            throw new UsernameNotFoundException("user not found");
        List<GrantedAuthority> grantedAuthorities=new ArrayList<>();

        return new CustomUserDetails(username,user.getPassword(),grantedAuthorities);
    }
}
