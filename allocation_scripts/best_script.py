
from web3 import Web3
w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
# w3 = Web3(Web3.HTTPProvider('https://api.avax-test.network/ext/C/rpc'))

import time
from itertools import product, combinations
# import ast

import json

with open("../artifacts/contracts/interfaces/IRouter.sol/IRouter.json") as f:
    router_json = json.load(f)
router_abi = router_json["abi"]

with open("../artifacts/contracts/protocol/aggregator/Aggregator.sol/Aggregator.json") as f:
    aggregator_json = json.load(f)
aggregator_abi = aggregator_json["abi"]

with open("../artifacts/contracts/interfaces/IAllocator.sol/IAllocator.json") as f:
    allocator_json = json.load(f)
allocator_abi = allocator_json["abi"]

with open("../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json") as f:
    erc20_json = json.load(f)
erc20_abi = erc20_json["abi"]

with open("../artifacts/contracts/interfaces/IPoolDataProvider.sol/IPoolDataProvider.json") as f:
    data_provider_json = json.load(f)
data_provider_abi = data_provider_json["abi"]

# wei	1
# kwei	1000
# babbage	1000
# femtoether	1000
# mwei	1000000
# lovelace	1000000
# picoether	1000000
# gwei	1000000000
# shannon	1000000000
# nanoether	1000000000
# nano	1000000000
# szabo	1000000000000
# microether	1000000000000
# micro	1000000000000
# finney	1000000000000000
# milliether	1000000000000000
# milli	1000000000000000
# ether	1000000000000000000
# kether	1000000000000000000000
# grand	1000000000000000000000
# mether	1000000000000000000000000
# gether	1000000000000000000000000000
# tether	1000000000000000000000000000000

ray = 1e27

current_allocation = []
routers = []

underlying_asset_address = "0x3E937B4881CBd500d05EeDAB7BA203f2b7B3f74f"
aggregator_address = "0x9B58Baf621613096195d818f29bC6dD5aB49DbEc"
data_provider_address = "0xc511a94eD6dA43ECcf89235A929D98DD782dC203"
decimals = 6

current_lowest_rate = 100
# total amount in aggregator
current_total_amount = 0 
# total amount being returned annually (current_total_amount*weighted_interest_rate)
current_return = 0 
# weighted interest rate
current_rate = 0 
# how many steps to compile per token
# eg steps is percentage of 100
# 1 step is 1% of current_total_amount per allocation
steps = 1

def current_rate_and_return(_current_allocation):
	for allocation in _current_allocation:
		current_return += allocation['interest_rate'] * allocation['balance']
		if (allocation['interest_rate'] < current_lowest_rate):
			current_lowest_rate = allocation['interest_rate']

	current_rate = current_return / current_total_amount

token_allocation_steps = []

#  --- every step of allocation for each protcol listed ---
# i.e. 
def compile_tokens_steps():
	for router in routers:
		# liquidity of specific protocol
		liquidity = router['liquidity']


		for step in range(steps, 101, steps):
			allocation_percentage = step / 100
			amount = current_total_amount * allocation_percentage

			# get interest rate model accounting for amount
			simualted_interest_rate = router['_router'].caller.getSimulatedInterestRate(underlying_asset_address, w3.toWei(amount, 'mwei'), w3.toWei(router['balance'], 'mwei'))/ray
			# only append if we can successfully initiate new distribution
			# if our balance > liquidity, then skip.
			# liquidity is how much we can withdraw
			if router['balance'] < liquidity:

				interest_rate = router['interest_rate']
				annual_return = amount * interest_rate
			
				token_allocation_steps.append({
					"protocol_id": router['protocol_id'],
					"underlying_address": router['underlying_address'],
					"token_address": router['token_address'],
					"interest_rate": interest_rate,
					"annual_return": annual_return,
					"allocation_percentage": allocation_percentage
				})


# --- remove duplicates in results ---
def check_duplicate(l):
    visited = set()
    has_duplicate = False
    for element in l:
        if element in visited:
            pass
        elif l.count(element) == 1:
            visited.add(element)
        elif l.count(element) > 1:
            has_duplicate = True
            # print("The list contains duplicate elements.")
            break
    if not has_duplicate:
    	return has_duplicate
        # print("List has no duplicate elements.")

    return has_duplicate

total_count = 0
results_count = 0

token_allocation_combinations_results = []

# --- combinations ---
def get_all_combinations():
	global total_count
	global results_count
	# print("len(routers) is: ", len(routers))
	for x in range(1, len(routers)+1):
		print("x is: ", x)
		for combo_list in combinations(token_allocation_steps, r=x):
			total_count += 1
			combo_list = list(combo_list)
			# print("combo_list", combo_list)

			# ignore none 1.0 allocation_percentage lists in 1 count results
			if len(combo_list) == 1:
				for allo in combo_list:
					if allo['allocation_percentage'] != 1.0:
						continue
			# ignore 1.0 allocation_percentage elements in > 1 list count results
			else:
				for allo in combo_list:
					if allo['allocation_percentage'] == 1.0:
						continue

			protocol_id_list = []

			# create list to check for duplicates
			for allo in combo_list:
				protocol_id_list.append(allo['protocol_id'])


			# ensure no protocol_id duplicates in combinations
			if len(protocol_id_list) > 1:
				if check_duplicate(protocol_id_list):
					continue

			# reset allocation percentage for each combination
			allocation_percentage = 0

			# add to allocation_percentage variable
			for allo in combo_list:
				allocation_percentage += allo['allocation_percentage']

			# ensure always using 100% of total balance
			if allocation_percentage != 1.0:
				continue

			results_count += 1

			# print("Key one is: ", *combo_list)


			token_allocation_combinations_results.append(combo_list)


def run():
	start = time.time()

	# compile platforms and steps
	compile_tokens_steps()

	# run each combination algo
	# 	if allocation beats current allocation
	get_all_combinations()

	# print(get_all_combinations())

	# sort by best annual return, or APR, && count of distributions ascending
	#	the goal is to redistribute into the highest annual return with the least aggregations

	# token_allocation_sorted = sorted(token_allocation_combinations_results, key=lambda x: (sum(i['annual_return'] for i in x), len), reverse=False)
	token_allocation_sorted = sorted(token_allocation_combinations_results, key=lambda x: (sum(i['annual_return'] for i in x)), reverse=True)
	print(" \n token_allocation_sorted", token_allocation_sorted[:4])

	# allocation params
	# - address asset
	# - address[] routers
	# - uint256[] ladderPercentages

	routers = []
	allocation_percentage = []
	n_allocation_percentage = [] # number version for printing result
	n_annual_return = [] # number version for printing result
	apr = 0

	best_result = []
	for result in token_allocation_sorted:
		best_result = result
		result_count = 0
		for r in result:
			result_count+=1
			# tx params
			routers.append(r['protocol_id'])
			allocation_percentage.append(str(int(r['allocation_percentage'] * (10**4))))
			n_allocation_percentage.append((int(r['allocation_percentage'] * (10**4))))
			n_annual_return.append((int(r['annual_return'])))
			# print variables
		print("result_count", result_count)
		print("current_total_amount", current_total_amount)
		apr = sum(n_annual_return) / current_total_amount
		print("apr", apr)
		break
	print(" \n best_result", best_result)
	print(" \n best_result", type(best_result))


	print(" \n apr", apr)
	print(" \n current_rate", current_rate)
	dif = (apr*100) - (current_rate*100)
	print(" \n dif", str(int(float(dif))))
	print(" \n dif", dif)

	print(" \n asset", underlying_asset_address)
	print(" \n routers", routers)
	print(" \n ladderPercentages", allocation_percentage)

	executionTime = (time.time() - start)
	print('Algorithm took: ' + str(executionTime), "seconds", "and found", results_count, "better allocations")

	print("Best result: \n ")
	print("Current APR: ", (current_rate*100))
	print("Best Found APR: ", (apr*100))
	print("APR +/-: ", (apr*100) - (current_rate*100))
	print("Income Difference % +/-: ", ((apr*100) - (current_rate*100))/(current_rate*100)*100, "%")
	print("Yrly Yield: ", apr*100,"%")

def init():
	global current_total_amount
	global current_rate
	global current_return

	_aggregator = w3.eth.contract(address=aggregator_address, abi=aggregator_abi)

	aggregated_balance = _aggregator.caller.getBalance()

	_erc20 = w3.eth.contract(address=underlying_asset_address, abi=erc20_abi)

	_decimals = 10**_erc20.caller.decimals()

	current_total_amount = aggregated_balance/_decimals

	# aggregator_weighted_interest_rate = _aggregator.caller.getRouterWeightedInterestRate()
	aggregator_weighted_data = _aggregator.caller.getRouterWeightedInterestRateSimulated()
	print("aggregator_weighted_data: ", aggregator_weighted_data)

	total_routed_balance = aggregator_weighted_data[0]/_decimals
	print("total_routed_balance: ", total_routed_balance)
	print("current_total_amount: ", current_total_amount)

	current_rate = aggregator_weighted_data[1]/ray

	current_router_annual_income = total_routed_balance * current_rate

	# current_return = current_total_amount * current_rate
	# current_return = current_router_annual_income/current_total_amount
	current_return = current_router_annual_income
	print("current_return: ", current_return)
	print("APR: ", current_router_annual_income/current_total_amount)

	routers_list = _aggregator.caller.getRoutersDataList()
	print("routers_list: ", routers_list)
	# get current and all router data
	for count, router in enumerate(routers_list):
		_router = w3.eth.contract(address=router, abi=router_abi)
		token_address = _router.caller.depositToken(underlying_asset_address)

		balance = _router.caller.getBalance(underlying_asset_address, _aggregator.address)/_decimals
		print("balance: ", balance)

		interest_rate = _router.caller.getPreviousInterestRate(underlying_asset_address)/ray
		print("interest_rate: ", interest_rate)

		liquidity = _router.caller.getLiquidity(underlying_asset_address)/_decimals

		print("liquidity: ", liquidity)

		if (balance > 0):
			current_allocation.append({
				"protocol_id": count,
				"underlying_address": underlying_asset_address,
				"interest_rate": interest_rate,
				"balance": balance,
				"token_address": token_address
			})

		if (interest_rate > 0):
			routers.append({
				"protocol_id": count,
				"_router": _router,
				"underlying_address": underlying_asset_address,
				"interest_rate": interest_rate,
				"liquidity": liquidity,
				"token_address": token_address,
				"balance": balance,
			})

	# run algo
	# 
	run()


init()