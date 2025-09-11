#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import traceback
import os
from config import SERVER_CONFIG

def test_connection():
    base_url = SERVER_CONFIG['base_url']
    print(f"测试连接到: {base_url}")
    
    # 检查代理设置
    print(f"\n=== 环境变量检查 ===")
    print(f"HTTP_PROXY: {os.environ.get('HTTP_PROXY', 'None')}")
    print(f"HTTPS_PROXY: {os.environ.get('HTTPS_PROXY', 'None')}")
    print(f"http_proxy: {os.environ.get('http_proxy', 'None')}")
    print(f"https_proxy: {os.environ.get('https_proxy', 'None')}")
    
    try:
        print("\n=== 测试健康检查端点 ===")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        }
        # 禁用代理
        proxies = {'http': None, 'https': None}
        response = requests.get(f"{base_url}/health", timeout=5, headers=headers, proxies=proxies)
        print(f"状态码: {response.status_code}")
        print(f"响应头: {dict(response.headers)}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 200:
            print("✅ 健康检查成功")
        else:
            print(f"❌ 健康检查失败，状态码: {response.status_code}")
            
    except requests.exceptions.ConnectionError as e:
        print(f"❌ 连接错误: {e}")
    except requests.exceptions.Timeout as e:
        print(f"❌ 超时错误: {e}")
    except Exception as e:
        print(f"❌ 其他错误: {e}")
        print(f"错误详情: {traceback.format_exc()}")

if __name__ == "__main__":
    test_connection()